import { Inject, Injectable, Injector, Optional } from "@angular/core";
import { BehaviorSubject, Observable, asyncScheduler } from "rxjs";
import { map, distinctUntilChanged, observeOn } from "rxjs/operators";
import { NgSimpleStateDevTool } from "./ng-simple-state-dev-tool";
import { NgSimpleStateLocalStorage } from "./ng-simple-state-local-storage";
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from "./ng-simple-state-models";
@Injectable()
export abstract class NgSimpleStateBaseStore<S> {

    private _state$: BehaviorSubject<S>;
    private _localStorageIsEnabled: boolean;
    private _localStorageKey: string;
    private _devToolIsEnabled: boolean;
    private _ngSimpleStateDevTool: NgSimpleStateDevTool;
    private _ngSimpleStateLocalStorage: NgSimpleStateLocalStorage;
    private _storeName: string;

    /**
    * Return the observable state
    * @returns Observable of the state
    */
    public get state(): BehaviorSubject<S> {
        return this._state$;
    }

    constructor(
        @Inject(Injector) injector: Injector,
        @Inject(NG_SIMPLE_STORE_CONFIG) @Optional() private config?: NgSimpleStateStoreConfig
    ) {
        this._ngSimpleStateDevTool = injector.get(NgSimpleStateDevTool);
        this._ngSimpleStateLocalStorage = injector.get(NgSimpleStateLocalStorage);

        this._localStorageIsEnabled = typeof this.config?.enableLocalStorage === 'boolean' ? this.config.enableLocalStorage : this._ngSimpleStateLocalStorage.isEnabled();
        this._localStorageKey = typeof this.config?.storageKey === 'string' ? this.config.storageKey : this.constructor.name;

        this._devToolIsEnabled = typeof this.config?.enableDevTool === 'boolean' ? this.config.enableDevTool : this._ngSimpleStateDevTool.isEnabled();
        this._storeName = typeof this.config?.storeName === 'string' ? this.config.storeName : this.constructor.name;

        let _initialState: S;
        if (this._localStorageIsEnabled) {
            _initialState = this._ngSimpleStateLocalStorage.getItem<S>(this._localStorageKey);
        }
        if (!_initialState) {
            _initialState = this.initialState();
        }

        this.devToolSend(_initialState, `initialState`);

        this._state$ = new BehaviorSubject<S>(Object.assign({}, _initialState));
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
    */
    setState(stateFn: (currentState: Readonly<S>) => Partial<S>, actionName?: string): void {
        const currState = this.getCurrentState();
        const newState = stateFn(currState);
        const state = Object.assign({}, currState, newState);
        this.devToolSend(state, actionName);
        this.setLocalStorage(state);
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
        return this._ngSimpleStateDevTool.send(`${this._storeName}.${actionName}`, newState);
    }

    /**
    * Set item into local storage
    * @param state state valie
    * @returns True if item is stored into local storage
    */
    private setLocalStorage(state: S): boolean {
        if (!this._localStorageIsEnabled) {
            return false;
        }
        return this._ngSimpleStateLocalStorage.setItem<S>(this._localStorageKey, state);
    }
}
