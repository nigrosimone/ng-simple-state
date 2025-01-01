import { Injectable, OnDestroy, Directive, isDevMode, inject } from '@angular/core';
import { NgSimpleStateDevTool } from './tool/ng-simple-state-dev-tool';
import type { NgSimpleStateBrowserStorage } from './storage/ng-simple-state-browser-storage';
import { NgSimpleStateLocalStorage } from './storage/ng-simple-state-local-storage';
import { NgSimpleStateSessionStorage } from './storage/ng-simple-state-session-storage';
import { type NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG, type NgSimpleStateSetState, type NgSimpleStateComparator, type NgSimpleStateSelectState, type StateFnOrNewState } from './ng-simple-state-models';


@Injectable()
@Directive()
export abstract class NgSimpleStateBaseCommonStore<S extends object | Array<unknown>> implements OnDestroy {

    protected abstract stackPoint: number;
    protected devTool!: NgSimpleStateDevTool;
    protected persistentStorage!: NgSimpleStateBrowserStorage;
    protected storeName: string;
    protected firstState!: S;
    protected initState!: S;
    protected isArray: boolean;
    protected devMode: boolean = isDevMode();
    protected comparator!: <S>(previous: S, current: S) => boolean;
    protected readonly selectFnRef = this.selectFn.bind(this);

    constructor() {

        const globalConfig = inject(NG_SIMPLE_STORE_CONFIG, { optional: true })
        const storeConfig = this.storeConfig() || {};
        const config = { ...globalConfig, ...storeConfig };

        if (config.persistentStorage === 'local') {
            this.persistentStorage = inject(NgSimpleStateLocalStorage);
        } else if (config.persistentStorage === 'session') {
            this.persistentStorage = inject(NgSimpleStateSessionStorage);
        }

        if (config.enableDevTool) {
            this.devTool = inject(NgSimpleStateDevTool);
        }

        this.storeName = config.storeName ?? this.constructor.name;

        if (typeof config.comparator === 'function') {
            this.comparator = config.comparator;
        }

        if (this.persistentStorage) {
            const firstState = this.persistentStorage.getItem<S>(this.storeName);
            if (firstState) {
                this.firstState = firstState;
            }
        }

        this.initState = this.initialState();
        if (!this.firstState) {
            this.firstState = this.initState;
        }

        this.devToolSend(this.firstState, 'initialState');

        this.isArray = Array.isArray(this.firstState);
    }

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    ngOnDestroy(): void {
        this.devToolSend(undefined, 'ngOnDestroy');
    }

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    protected abstract storeConfig(): NgSimpleStateStoreConfig;

    /**
     * Set into the store the initial state
     * @returns The state object
     */
    protected abstract initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abstract selectState<K = Partial<S>>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): any;

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    abstract setState(newState: Partial<S>, actionName?: string): boolean;

    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    abstract setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean;

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    abstract getCurrentState(): Readonly<S>;

    /**
     * Return the first loaded store state:
     * the last saved state
     * otherwise the initial state provided from `initialState()` method.
     * @returns The first state
     */
    getFirstState(): Readonly<S> | null {
        return this.deepFreeze(this.firstState);
    }

    /**
     * Reset store to first loaded store state:
     *  - the last saved state
     *  - otherwise the initial state provided from `initialState()` method.
     */
    resetState(): boolean {
        return this.setState(() => this.firstState, 'resetState');
    }

    /**
     * Restart the store to initial state provided from `initialState()` method
     */
    restartState(): boolean {
        return this.setState(() => this.initState, 'restartState');
    }

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     */
    protected patchState(newState: Partial<S>, actionName?: string): S | undefined;
    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     */
    protected patchState(stateFn: NgSimpleStateSetState<S>, actionName?: string): S | undefined;
    /**
     * Set a new state
     * @param stateFnOrNewState State reducer or new state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     */
    protected patchState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): S | undefined;
    protected patchState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): S | undefined {
        const currState = this.getCurrentState();
        let newState: Partial<S>;
        if (typeof stateFnOrNewState === 'function') {
            newState = stateFnOrNewState(currState);
        } else {
            newState = stateFnOrNewState;
        }
        if (currState === newState) {
            return undefined;
        }
        let state: S;
        if (this.isArray) {
            state = Object.assign([] as S, newState);
        } else {
            state = Object.assign({}, currState, newState);
        }
        if (this.comparator && this.comparator(currState, newState)) {
            return undefined;
        }
        this.devToolSend(state, actionName);
        this.statePersist(state);
        return state;
    }

    protected selectFn<K>(tmpState: Readonly<S>) {
        return Object.assign(this.isArray ? [] : {}, tmpState) as K;
    }

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if dev tools are enabled
     */
    protected devToolSend(newState: S | undefined, actionName?: string): boolean {
        if (!this.devTool) {
            return false;
        }
        if (!actionName) {
            // retrieve the parent (of parent) method into the stack trace
            try {
                actionName = new Error().stack
                    ?.split('\n')[this.stackPoint]
                    ?.trim()
                    ?.split(' ')[1]
                    ?.split('.')[1] || 'unknown';
                /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            } catch (_) {
                actionName = 'unknown';
            }
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
    protected deepFreeze(object: S): Readonly<S> {
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
        /* eslint-disable @typescript-eslint/no-explicit-any */
        Object.keys(object).forEach(key => this.deepFreeze((object as any)[key]));

        return object as Readonly<S>;
    }

    /**
     * Persist state to storage
     */
    protected statePersist(state: S) {
        if (this.persistentStorage) {
            this.persistentStorage.setItem<S>(this.storeName, state);
        }
    }
}
