import { Injectable, OnDestroy, Directive } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler, Subject, takeUntil, Subscription } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';
import type { NgSimpleStateComparator, NgSimpleStateReplaceState, NgSimpleStateSelectState, NgSimpleStateSetState, StateFnOrNewState, StateFnOrReplaceState, NgSimpleStateProducer } from '../ng-simple-state-models';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseRxjsStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> implements OnDestroy {

    protected stackPoint: number = 4;
    private readonly state$: BehaviorSubject<S> = new BehaviorSubject<S>(this.firstState);
    private readonly stateObs: Observable<S> = this.state$.asObservable();
    private readonly destroy$ = new Subject<void>();
    private readonly registeredEffects: Map<string, Subscription> = new Map();

    /**
     * Return the observable of the state
     * @returns Observable of the state
     */
    public get state(): Observable<S> {
        return this.stateObs;
    }

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.destroy$.next();
        this.destroy$.complete();
        this.state$.complete();
        this.destroyAllEffects();
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    selectState<K = Partial<S>>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): Observable<K> {
        if (!selectFn) {
            return this.stateObs as unknown as Observable<K>;
        }
        return this.state$.pipe(
            map(state => selectFn(state as Readonly<S>)),
            distinctUntilChanged(comparator ?? this.comparator as NgSimpleStateComparator),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Create an effect that reacts to state changes
     * @param name Unique effect name
     * @param effectFn Effect function that receives current state
     */
    createEffect(name: string, effectFn: (state: S) => void): void {
        // Cleanup existing effect with same name
        this.destroyEffect(name);
        
        const subscription = this.state$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(state => {
            effectFn(state);
        });
        
        this.registeredEffects.set(name, subscription);
    }

    /**
     * Create an effect that reacts to selected state changes
     * @param name Unique effect name
     * @param selector State selector
     * @param effectFn Effect function that receives selected value
     */
    createSelectorEffect<K>(
        name: string, 
        selector: NgSimpleStateSelectState<S, K>, 
        effectFn: (selected: K) => void
    ): void {
        this.destroyEffect(name);
        
        const subscription = this.selectState(selector).pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            effectFn(value);
        });
        
        this.registeredEffects.set(name, subscription);
    }

    /**
     * Destroy a specific effect by name
     * @param name Effect name to destroy
     */
    destroyEffect(name: string): void {
        const subscription = this.registeredEffects.get(name);
        if (subscription) {
            subscription.unsubscribe();
            this.registeredEffects.delete(name);
        }
    }

    /**
     * Destroy all registered effects
     */
    destroyAllEffects(): void {
        this.registeredEffects.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.registeredEffects.clear();
    }

    /**
     * Get all registered effect names
     */
    getEffectNames(): string[] {
        return Array.from(this.registeredEffects.keys());
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S> {
        return this.devMode ? this.deepFreeze(this.state$.getValue()) : this.state$.getValue();
    }

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(newState: Partial<S>, actionName?: string): boolean;
    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean;
    setState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): boolean {
        const state = this._setState(stateFnOrNewState, actionName);
        if (typeof state !== 'undefined') {
            this.state$.next(state);
            return true;
        }
        return false;
    }

    /**
     * Set state using Immer-style producer function for immutable updates
     * Allows writing mutable-looking code that produces immutable updates
     * @param producer Producer function that receives draft state
     * @param actionName The action label into Redux DevTools
     * @returns True if the state is changed
     * 
     * @example
     * ```ts
     * // Instead of:
     * this.setState(state => ({ 
     *   ...state, 
     *   users: state.users.map(u => u.id === id ? { ...u, name } : u) 
     * }));
     * 
     * // You can write:
     * this.produce(draft => {
     *   const user = draft.users.find(u => u.id === id);
     *   if (user) user.name = name;
     * });
     * ```
     */
    produce(producer: NgSimpleStateProducer<S>, actionName?: string): boolean {
        const currentState = this.getCurrentState();
        
        // If Immer is configured, use it
        if (this.immerProduce) {
            const nextState = this.immerProduce(currentState as S, producer);
            return this.replaceState(nextState, actionName ?? 'produce');
        }
        
        // Fallback: use structuredClone for a deep copy
        const draft = structuredClone(currentState) as S;
        const result = producer(draft);
        const nextState = result !== undefined ? result : draft;
        
        return this.replaceState(nextState, actionName ?? 'produce');
    }

    /**
     * Replace state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(newState: S, actionName?: string): boolean;
    /**
     * Replace state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): boolean;
    replaceState(stateFnOrNewState: StateFnOrReplaceState<S>, actionName?: string): boolean {
        const state = this._replaceState(stateFnOrNewState, actionName);
        if (typeof state !== 'undefined') {
            this.state$.next(state);
            return true;
        }
        return false;
    }
}
