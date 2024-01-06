import { Inject, Injectable, Injector, OnDestroy, Directive, Signal, signal, computed, WritableSignal } from '@angular/core';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> implements OnDestroy {

    protected stackPoint: number = 6;
    private stateSig: WritableSignal<S>;

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
     * @returns Signal of the selected state
     */
    selectState<K>(selectFn?: (state: Readonly<S>) => K): Signal<K> {
        if (!selectFn) {
            selectFn = (tmpState: Readonly<S>) => Object.assign(this.isArray ? [] : {}, tmpState) as K;
        }
        return computed(() => (selectFn as (state: Readonly<S>) => K)(this.stateSig() as Readonly<S>));
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
            if (this.localStorageIsEnabled && this.persistentStorage) {
                this.persistentStorage.setItem<S>(this.storeName, state);
            }
            return state;
        })
        return result;
    }
}
