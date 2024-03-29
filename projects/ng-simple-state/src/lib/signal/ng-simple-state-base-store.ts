import { Inject, Injectable, Injector, Directive, Signal, signal, computed, WritableSignal } from '@angular/core';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> {

    protected stackPoint: number = 6;
    private readonly stateSig: WritableSignal<S>;

    /**
     * Return the Signal of the state
     * @returns Signal of the state
     */
    public get state(): Signal<S> {
        return this.stateSig.asReadonly();
    }

    constructor(@Inject(Injector) injector: Injector) {
        super(injector);
        this.stateSig = signal<S>(Object.assign(this.isArray ? [] : {}, this.firstState));
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Signal of the selected state
     */
    selectState<K>(selectFn?: (state: Readonly<S>) => K, comparator?: (previous: K, current: K) => boolean): Signal<K> {
        if (!selectFn) {
            selectFn = (tmpState: Readonly<S>) => Object.assign(this.isArray ? [] : {}, tmpState) as K;
        }
        if (!comparator && this.comparator) {
            comparator = this.comparator;
        }
        return computed(() => (selectFn as (state: Readonly<S>) => K)(this.stateSig() as Readonly<S>), { equal: comparator });
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
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(stateFn: (currentState: Readonly<S>) => Partial<S>, actionName?: string): boolean {
        let result = true;
        this.stateSig.update(currState => {
            const newState = stateFn(currState);
            if (currState === newState) {
                result = false;
                return currState;
            }
            let state: S;
            if (this.isArray) {
                state = Object.assign([] as S, newState);
            } else {
                state = Object.assign({}, currState, newState);
            }
            this.devToolSend(state, actionName);
            this.statePersist(state);
            return state;
        })
        return result;
    }
}
