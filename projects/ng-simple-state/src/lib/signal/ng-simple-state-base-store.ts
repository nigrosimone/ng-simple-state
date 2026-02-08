import { Injectable, Directive, Signal, signal, computed, WritableSignal, effect, EffectRef, linkedSignal, inject, Injector, runInInjectionContext } from '@angular/core';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';
import type { NgSimpleStateComparator, NgSimpleStateReplaceState, NgSimpleStateSelectState, NgSimpleStateSetState, StateFnOrNewState, StateFnOrReplaceState, NgSimpleStateLinkedOptions, NgSimpleStateProducer } from '../ng-simple-state-models';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> {

    protected stackPoint: number = 4;
    private readonly stateSig: WritableSignal<S> = signal<S>(this.firstState);
    private readonly stateSigRo: Signal<S> = this.stateSig.asReadonly();
    private readonly registeredEffects: Map<string, EffectRef> = new Map();
    private readonly injector = inject(Injector);

    /**
     * Apply state directly from DevTools time-travel.
     * Sets the signal without triggering devtool send or plugins.
     */
    protected applyDevToolState(state: S): void {
        this.stateSig.set(state);
    }

    /**
     * Return the Signal of the state
     * @returns Signal of the state
     */
    public get state(): Signal<S> {
        return this.stateSigRo;
    }

    /**
     * Cleanup registered effects on destroy
     */
    override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.destroyAllEffects();
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Signal of the selected state
     */
    selectState<K = Partial<S>>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): Signal<K> {
        if (!selectFn) {
            return this.stateSigRo as unknown as Signal<K>;
        }
        return computed(() => selectFn(this.stateSig() as Readonly<S>), { equal: comparator ?? this.comparator as NgSimpleStateComparator });
    }

    /**
     * Create a linked signal that derives from store state
     * Supports bidirectional updates (Angular 21+)
     * @param options LinkedSignal options
     * @returns WritableSignal that is linked to the store state
     */
    linkedState<K>(options: NgSimpleStateLinkedOptions<S, K>): WritableSignal<K> {
        const sourceSignal = computed(() => options.source(this.stateSig()));
        
        return linkedSignal({
            source: sourceSignal,
            computation: (source, previous) => {
                if (options.computation) {
                    return options.computation(source, previous?.value);
                }
                return source;
            }
        });
    }

    /**
     * Create an effect that reacts to state changes
     * @param name Unique effect name
     * @param effectFn Effect function that receives current state
     * @returns EffectRef for cleanup
     */
    createEffect(name: string, effectFn: (state: S) => void | (() => void)): EffectRef {
        // Cleanup existing effect with same name
        this.destroyEffect(name);
        
        let cleanup: (() => void) | void;
        
        const effectRef = runInInjectionContext(this.injector, () => effect(() => {
            const state = this.stateSig();
            
            // Run previous cleanup
            if (cleanup) {
                cleanup();
            }
            
            cleanup = effectFn(state);
        }));
        
        this.registeredEffects.set(name, effectRef);
        return effectRef;
    }

    /**
     * Create an effect that reacts to selected state changes
     * @param name Unique effect name
     * @param selector State selector
     * @param effectFn Effect function that receives selected value
     * @returns EffectRef for cleanup
     */
    createSelectorEffect<K>(
        name: string, 
        selector: NgSimpleStateSelectState<S, K>, 
        effectFn: (selected: K) => void | (() => void)
    ): EffectRef {
        this.destroyEffect(name);
        
        const selectedSignal = computed(() => selector(this.stateSig()));
        let cleanup: (() => void) | void;
        
        const effectRef = runInInjectionContext(this.injector, () => effect(() => {
            const value = selectedSignal();
            
            if (cleanup) {
                cleanup();
            }
            
            cleanup = effectFn(value);
        }));
        
        this.registeredEffects.set(name, effectRef);
        return effectRef;
    }

    /**
     * Destroy a specific effect by name
     * @param name Effect name to destroy
     */
    destroyEffect(name: string): void {
        const effectRef = this.registeredEffects.get(name);
        if (effectRef) {
            effectRef.destroy();
            this.registeredEffects.delete(name);
        }
    }

    /**
     * Destroy all registered effects
     */
    destroyAllEffects(): void {
        this.registeredEffects.forEach((effectRef) => {
            effectRef.destroy();
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
        return this.devMode ? this.deepFreeze(this.stateSig()) : this.stateSig();
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
            this.stateSig.set(state);
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
    replaceState(stateFnOrReplaceState: StateFnOrReplaceState<S>, actionName?: string): boolean {
        const state = this._replaceState(stateFnOrReplaceState, actionName);
        if (typeof state !== 'undefined') {
            this.stateSig.set(state);
            return true;
        }
        return false;
    }
}
