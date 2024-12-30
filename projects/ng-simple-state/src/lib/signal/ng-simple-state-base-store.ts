import { Injectable, Directive, Signal, signal, computed, WritableSignal } from '@angular/core';
import { NgSimpleStateBaseCommonStore, StateFnOrNewState } from '../ng-simple-state-common';
import { NgSimpleStateComparator, NgSimpleStateSelectState, NgSimpleStateSetState } from '../ng-simple-state-models';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> {

    protected stackPoint: number = 4;
    private readonly stateSig: WritableSignal<S>;
    private readonly stateSigRo: Signal<S>

    /**
     * Return the Signal of the state
     * @returns Signal of the state
     */
    public get state(): Signal<S> {
        return this.stateSigRo;
    }

    constructor() {
        super();
        this.stateSig = signal<S>(this.selectFn(this.firstState));
        this.stateSigRo = this.stateSig.asReadonly();
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Signal of the selected state
     */
    selectState<K = Partial<S>>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): Signal<K> {
        selectFn ??= this.selectFn.bind(this);
        return computed(() => selectFn(this.stateSig() as Readonly<S>), { equal: comparator ?? this.comparator });
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S> {
        return this.deepFreeze(this.stateSig());
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
        const currState = this.getCurrentState();
        const state = this.patchState(currState, stateFnOrNewState, actionName);
        if (typeof state !== 'undefined') {
            this.stateSig.set(state);
            return true;
        }
        return false;
    }
}
