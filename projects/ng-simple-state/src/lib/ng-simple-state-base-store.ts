import { Inject, Injectable, Injector, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBrowserStorage } from './ng-simple-state-browser-storage';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from './ng-simple-state-models';
import { NgSimpleStateSessionStorage } from './ng-simple-state-session-storage';
@Injectable()
export abstract class NgSimpleStateBaseStore<S extends object | Array<any>> implements OnDestroy {

    private state$: BehaviorSubject<S>;
    private localStorageIsEnabled: boolean;
    private devToolIsEnabled: boolean;
    private devTool: NgSimpleStateDevTool;
    private persistentStorage: NgSimpleStateBrowserStorage;
    private localStoreConfig: NgSimpleStateStoreConfig;
    private storeName: string;
    private firstState: S | null = null;
    private isArray: boolean;

    /**
     * Return the observable state
     * @returns Observable of the state
     */
    public get state(): BehaviorSubject<S> {
        return this.state$;
    }

    constructor(@Inject(Injector) injector: Injector) {
        this.devTool = injector.get(NgSimpleStateDevTool);

        const globalConfig = injector.get(NG_SIMPLE_STORE_CONFIG, {});
        const storeConfig = this.storeConfig() || {};
        this.localStoreConfig = { ...globalConfig, ...storeConfig };

        if (this.localStoreConfig.persistentStorage === 'local') {
            this.persistentStorage = injector.get(NgSimpleStateLocalStorage);
        } else if (this.localStoreConfig.persistentStorage === 'session') {
            this.persistentStorage = injector.get(NgSimpleStateSessionStorage);
        } else {
            this.persistentStorage = injector.get(NgSimpleStateLocalStorage);
        }

        this.localStorageIsEnabled = typeof this.localStoreConfig.enableLocalStorage === 'boolean' ? this.localStoreConfig.enableLocalStorage : false;
        this.devToolIsEnabled = typeof this.localStoreConfig.enableDevTool === 'boolean' ? this.localStoreConfig.enableDevTool : false;
        this.storeName = typeof this.localStoreConfig.storeName === 'string' ? this.localStoreConfig.storeName : this.constructor.name;

        if (this.localStorageIsEnabled) {
            this.firstState = this.persistentStorage.getItem<S>(this.storeName);
        }
        if (!this.firstState) {
            this.firstState = this.initialState();
        }

        this.devToolSend(this.firstState, `initialState`);

        this.isArray = Array.isArray(this.firstState);
        this.state$ = new BehaviorSubject<S>(Object.assign(this.isArray ? [] : {}, this.firstState));
    }

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    ngOnDestroy(): void {
        this.devToolSend(undefined, 'ngOnDestroy');
        this.state$.complete();
    }

    /**
     * Reset store to first loaded store state
     */
    resetState(): void {
        this.setState(() => (this.firstState as S), 'resetState');
    }

    /**
     * Reset store to initial store state
     */
    restartState(): void {
        this.setState(() => (this.initialState()), 'restartState');
    }

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    storeConfig(): NgSimpleStateStoreConfig | null {
        return null;
    }

    /**
     * Set into the store the initial state
     * @returns The state object
     */
    protected abstract initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @returns Observable of the selected state
     */
    // eslint-disable-next-line no-unused-vars
    selectState<K>(selectFn?: (state: Readonly<S>) => K): Observable<K> {
        if (!selectFn) {
            selectFn = (tmpState: Readonly<S>): any => Object.assign(this.isArray ? [] : {}, tmpState);
        }
        return this.state$.pipe(
            map(state => (selectFn as any)(state as Readonly<S>)),
            distinctUntilChanged(),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): S {
        return this.state$.getValue();
    }

    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     */
    // eslint-disable-next-line no-unused-vars
    setState(stateFn: (currentState: Readonly<S>) => Partial<S>, actionName?: string): void {
        const currState = this.getCurrentState();
        const newState = stateFn(currState);
        let state: S;
        if (this.isArray) {
            state = Object.assign([], newState) as any;
        } else {
            state = Object.assign({}, currState, newState);
        }
        this.devToolSend(state, actionName);
        if (this.localStorageIsEnabled) {
            this.persistentStorage.setItem<S>(this.storeName, state);
        }
        this.state$.next(state);
    }

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if f??dev tools are enabled
     */
    private devToolSend(newState: S | undefined, actionName?: string): boolean {
        if (!this.devToolIsEnabled) {
            return false;
        }
        if (!actionName) {
            // retrive the parent (of parent) method into the stack trace
            actionName = new Error().stack
                ?.split('\n')[3]
                .trim()
                .split(' ')[1]
                .split('.')[1];
        }
        return this.devTool.send(this.storeName, actionName || 'unknown', newState);
    }
}
