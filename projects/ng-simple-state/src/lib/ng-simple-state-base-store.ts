import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from './ng-simple-state-models';
@Injectable()
export abstract class NgSimpleStateBaseStore<S> {

    private state$: BehaviorSubject<S>;
    private localStorageIsEnabled: boolean;
    private devToolIsEnabled: boolean;
    private devTool: NgSimpleStateDevTool;
    private localStorage: NgSimpleStateLocalStorage;
    private localStoreConfig: NgSimpleStateStoreConfig;
    private storeName: string;
    private firstState: S;

    /**
     * Return the observable state
     * @returns Observable of the state
     */
    public get state(): BehaviorSubject<S> {
        return this.state$;
    }

    constructor(@Inject(Injector) injector: Injector) {
        this.devTool = injector.get(NgSimpleStateDevTool);
        this.localStorage = injector.get(NgSimpleStateLocalStorage);

        const globalConfig = injector.get(NG_SIMPLE_STORE_CONFIG, {});
        const storeConfig = this.storeConfig() || {};
        this.localStoreConfig = { ...globalConfig, ...storeConfig };

        this.localStorageIsEnabled = typeof this.localStoreConfig.enableLocalStorage === 'boolean' ? this.localStoreConfig.enableLocalStorage : false;
        this.devToolIsEnabled = typeof this.localStoreConfig.enableDevTool === 'boolean' ? this.localStoreConfig.enableDevTool : false;
        this.storeName = typeof this.localStoreConfig.storeName === 'string' ? this.localStoreConfig.storeName : this.constructor.name;


        if (this.localStorageIsEnabled) {
            this.firstState = this.localStorage.getItem<S>(this.storeName);
        }
        if (!this.firstState) {
            this.firstState = this.initialState();
        }

        this.devToolSend(this.firstState, `initialState`);

        this.state$ = new BehaviorSubject<S>(Object.assign({}, this.firstState));
    }

    /**
     * Reset store to first store state
     */
    resetState(): void {
        this.setState(() => (this.firstState), 'resetState');
    }

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    storeConfig(): NgSimpleStateStoreConfig {
        return null;
    }

    /**
     * Set into the store the initial state
     * @returns The state object
     */
    protected abstract initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector
     * @returns Observable of the selected state
     */
    selectState<K>(selectFn: (state: Readonly<S>) => K): Observable<K> {
        return this.state$.pipe(
            map(state => selectFn(state as Readonly<S>)),
            distinctUntilChanged(),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): S {
        return this.state$.value;
    }

    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     */
    setState(stateFn: (currentState: Readonly<S>) => Partial<S>, actionName?: string): void {
        const currState = this.getCurrentState();
        const newState = stateFn(currState);
        const state = Object.assign({}, currState, newState);
        this.devToolSend(state, actionName);
        if (this.localStorageIsEnabled) {
            this.localStorage.setItem<S>(this.storeName, state);
        }
        this.state$.next(state);
    }

    /**
     * Complete the state
     */
    completeState(): void {
        this.state$.complete();
    }

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if fìdev tools are enabled
     */
    private devToolSend(newState: S, actionName?: string): boolean {
        if (!this.devToolIsEnabled) {
            return false;
        }
        if (!actionName) {
            // retrive the parent (of parent) method into the stack trace
            actionName = new Error().stack
                .split('\n')[3]
                .trim()
                .split(' ')[1]
                .split('.')[1];
        }
        return this.devTool.send(`${this.storeName}.${actionName}`, newState);
    }
}
