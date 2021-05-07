import { Inject, Injectable, Injector } from "@angular/core";
import { BehaviorSubject, Observable, asyncScheduler } from "rxjs";
import { map, distinctUntilChanged, observeOn } from "rxjs/operators";
import { NgSimpleStateDevTool } from "./ng-simple-state-dev-tool";
import { NgSimpleStateLocalStorage } from "./ng-simple-state-local-storage";
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from "./ng-simple-state-models";
@Injectable()
export abstract class NgSimpleStateBaseStore<S> {

    private _state$: BehaviorSubject<S>;
    private _localStorageIsEnabled: boolean;
    private _devToolIsEnabled: boolean;
    private _devTool: NgSimpleStateDevTool;
    private _localStorage: NgSimpleStateLocalStorage;
    private _storeConfig: NgSimpleStateStoreConfig;
    private _storeName: string;
    private _firstState: S;

    /**
    * Return the observable state
    * @returns Observable of the state
    */
    public get state(): BehaviorSubject<S> {
        return this._state$;
    }

    constructor(
        @Inject(Injector) injector: Injector
    ) {
        this._devTool = injector.get(NgSimpleStateDevTool);
        this._localStorage = injector.get(NgSimpleStateLocalStorage);

        const _globalConfig = injector.get(NG_SIMPLE_STORE_CONFIG, {});
        const _storeConfig = this.storeConfig() || {};
        this._storeConfig = { ..._globalConfig, ..._storeConfig };

        this._localStorageIsEnabled = typeof this._storeConfig.enableLocalStorage === 'boolean' ? this._storeConfig.enableLocalStorage : false;
        this._devToolIsEnabled = typeof this._storeConfig.enableDevTool === 'boolean' ? this._storeConfig.enableDevTool : false;
        this._storeName = typeof this._storeConfig.storeName === 'string' ? this._storeConfig.storeName : this.constructor.name;

        
        if (this._localStorageIsEnabled) {
            this._firstState = this._localStorage.getItem<S>(this._storeName);
        }
        if (!this._firstState) {
            this._firstState = this.initialState();
        }

        this.devToolSend(this._firstState, `initialState`);

        this._state$ = new BehaviorSubject<S>(Object.assign({}, this._firstState));
    }

    /**
     * Reset store to first store state
     */
    resetState() {
        this.setState(() => (this._firstState), 'resetState');
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
        return this._state$.pipe(
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
        return this._state$.value;
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
        if (this._localStorageIsEnabled) {
            this._localStorage.setItem<S>(this._storeName, state)
        }
        this._state$.next(state);
    }

    /**
    * Complete the state
    */
    completeState(): void {
        this._state$.complete();
    }

    /**
    * Send to dev tool a new state
    * @param newState new state
    * @param actionName The action name
    * @returns True if fìdev tools are enabled
    */
    private devToolSend(newState: S, actionName?: string): boolean {
        if (!this._devToolIsEnabled) {
            return false;
        }
        if (!actionName) {
            // retrive the parent (of parent) method into the stack trace
            actionName = new Error().stack
                .split("\n")[3]
                .trim()
                .split(" ")[1]
                .split(".")[1];
        }
        return this._devTool.send(`${this._storeName}.${actionName}`, newState);
    }
}
