import { Injectable, OnDestroy, Directive } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';
import type { NgSimpleStateComparator, NgSimpleStateSelectState, NgSimpleStateSetState, StateFnOrNewState } from '../ng-simple-state-models';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseRxjsStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> implements OnDestroy {

    protected stackPoint: number = 4;
    private readonly state$: BehaviorSubject<S> = new BehaviorSubject<S>(this.selectFn(this.firstState));
    private readonly stateObs: Observable<S> = this.state$.asObservable();

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
        this.state$.complete();
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    selectState<K = Partial<S>>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): Observable<K> {
        selectFn ??= this.selectFnRef;
        return this.state$.pipe(
            map(state => selectFn(state as Readonly<S>)),
            distinctUntilChanged(comparator ?? this.comparator as NgSimpleStateComparator),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S> {
        return this.deepFreeze(this.state$.getValue());
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
        const state = this.patchState(stateFnOrNewState, actionName);
        if (typeof state !== 'undefined') {
            this.state$.next(state);
            return true;
        }
        return false;
    }
}
