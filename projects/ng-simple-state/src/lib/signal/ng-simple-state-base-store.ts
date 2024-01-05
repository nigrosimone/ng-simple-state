import { Inject, Injectable, Injector, OnDestroy, Directive, isDevMode, Signal, signal, computed, WritableSignal } from '@angular/core';
import { NgSimpleStateBrowserStorage } from './../ng-simple-state-browser-storage';
import { NgSimpleStateDevTool } from './../ng-simple-state-dev-tool';
import { NgSimpleStateLocalStorage } from './../ng-simple-state-local-storage';
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from './../ng-simple-state-models';
import { NgSimpleStateSessionStorage } from './../ng-simple-state-session-storage';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> implements OnDestroy {

    private stateSig: WritableSignal<S>;
    private localStorageIsEnabled: boolean;
    private devToolIsEnabled: boolean;
    private devTool!: NgSimpleStateDevTool;
    private persistentStorage!: NgSimpleStateBrowserStorage;
    private localStoreConfig: NgSimpleStateStoreConfig;
    private storeName: string;
    private firstState!: S;
    private isArray: boolean;
    private devMode: boolean = isDevMode();

    /**
     * Return the Signal of the state
     * @returns Signal of the state
     */
    public get state(): Signal<S> {
        return this.stateSig.asReadonly();
    }

    constructor(@Inject(Injector) injector: Injector) {

        const globalConfig = injector.get(NG_SIMPLE_STORE_CONFIG, {});
        const storeConfig = this.storeConfig() || {};
        this.localStoreConfig = { ...globalConfig, ...storeConfig };

        this.localStorageIsEnabled = typeof this.localStoreConfig.enableLocalStorage === 'boolean' ? this.localStoreConfig.enableLocalStorage : false;

        if (this.localStorageIsEnabled) {
            if (this.localStoreConfig.persistentStorage === 'local') {
                this.persistentStorage = injector.get(NgSimpleStateLocalStorage);
            } else if (this.localStoreConfig.persistentStorage === 'session') {
                this.persistentStorage = injector.get(NgSimpleStateSessionStorage);
            }
        }

        this.devToolIsEnabled = typeof this.localStoreConfig.enableDevTool === 'boolean' ? this.localStoreConfig.enableDevTool : false;
        if (this.devToolIsEnabled) {
            this.devTool = injector.get(NgSimpleStateDevTool);
        }

        this.storeName = typeof this.localStoreConfig.storeName === 'string' ? this.localStoreConfig.storeName : this.constructor.name;

        if (this.localStorageIsEnabled && this.persistentStorage) {
            const firstState = this.persistentStorage.getItem<S>(this.storeName);
            if (firstState) {
                this.firstState = firstState;
            }
        }
        if (!this.firstState) {
            this.firstState = this.initialState(injector);
        }

        this.devToolSend(this.firstState, `initialState`);

        this.isArray = Array.isArray(this.firstState);
        this.stateSig = signal<S>(Object.assign(this.isArray ? [] : {}, this.firstState));
    }

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    ngOnDestroy(): void {
        this.devToolSend(undefined, 'ngOnDestroy');
    }

    /**
     * Reset store to first loaded store state:
     *  - the last saved state, if `enableLocalStorage` config is `true`
     *  - otherwise the initial state provided from `initialState()` method.
     */
    resetState(): boolean {
        return this.setState(() => this.firstState, 'resetState');
    }

    /**
     * Restart the store to initial state provided from `initialState()` method
     */
    restartState(): boolean {
        return this.setState(() => this.initialState(), 'restartState');
    }

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    protected abstract storeConfig(): NgSimpleStateStoreConfig;

    /**
     * Set into the store the initial state
     * @param injector current Injector
     * @returns The state object
     */
    protected abstract initialState(injector?: Injector): S;

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
     * Return the first loaded store state:
     * the last saved state, if `enableLocalStorage` config is `true`;
     * otherwise the initial state provided from `initialState()` method.
     * @returns The first state
     */
    getFirstState(): Readonly<S> | null {
        return this.deepFreeze(this.firstState);
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

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if dev tools are enabled
     */
    private devToolSend(newState: S | undefined, actionName?: string): boolean {
        if (!this.devToolIsEnabled || !this.devTool) {
            return false;
        }
        if (!actionName) {
            // retrieve the parent (of parent) method into the stack trace
            actionName = new Error().stack
                ?.split('\n')[6]
                .trim()
                .split(' ')[1]
                .split('.')[1] || 'unknown';
        }
        if (!this.devTool.send(this.storeName, actionName, newState)) {
            console.log(this.storeName + '.' + actionName, newState);
        }
        return true;
    }

    /**
     * Recursively Object.freeze simple Javascript structures consisting of plain objects, arrays, and primitives.
     * Make the data immutable.
     * @returns immutable object
     */
    private deepFreeze(object: S): Readonly<S> {
        // No freezing in production (for better performance).
        if (!this.devMode || !object) {
            return object as Readonly<S>;
        }

        // When already frozen, we assume its children are frozen (for better performance).
        // This should be true if you always use `deepFreeze` to freeze objects.
        //
        // Note that Object.isFrozen will also return `true` for primitives (numbers,
        // strings, booleans, undefined, null), so there is no need to check for
        // those explicitly.
        if (Object.isFrozen(object)) {
            return object as Readonly<S>;
        }

        // At this point we know that we're dealing with either an array or plain object, so
        // just freeze it and recurse on its values.
        Object.freeze(object);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(object).forEach(key => this.deepFreeze((object as any)[key]));

        return object as Readonly<S>;
    }
}
