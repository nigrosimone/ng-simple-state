import { Inject, Injectable, Injector, OnDestroy, Directive, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBrowserStorage } from './ng-simple-state-browser-storage';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';
import { NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from './ng-simple-state-models';
import { NgSimpleStateSessionStorage } from './ng-simple-state-session-storage';

@Injectable()
@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class NgSimpleStateBaseStore<S extends object | Array<any>> implements OnDestroy {

    private state$: BehaviorSubject<S>;
    private localStorageIsEnabled: boolean;
    private devToolIsEnabled: boolean;
    private devTool!: NgSimpleStateDevTool;
    private persistentStorage!: NgSimpleStateBrowserStorage;
    private localStoreConfig: NgSimpleStateStoreConfig;
    private storeName: string;
    private firstState!: S;
    private isArray: boolean;
    private devMode: boolean = isDevMode();
    private comparator!: <K>(previous: K, current: K) => boolean;

    /**
     * Return the observable of the state
     * @returns Observable of the state
     */
    public get state(): BehaviorSubject<S> {
        return this.state$;
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
        if (typeof this.localStoreConfig.comparator === 'function') {
            this.comparator = this.localStoreConfig.comparator;
        }

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
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    selectState<K>(selectFn?: (state: Readonly<S>) => K, comparator?: (previous: K, current: K) => boolean): Observable<K> {
        if (!selectFn) {
            selectFn = (tmpState: Readonly<S>) => Object.assign(this.isArray ? [] : {}, tmpState) as unknown as K;
        }
        if (!comparator && this.comparator) {
            comparator = this.comparator;
        }
        return this.state$.pipe(
            map(state => (selectFn as (state: Readonly<S>) => K)(state as Readonly<S>)),
            distinctUntilChanged(comparator),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S> {
        return this.deepFreeze(this.state$.getValue());
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
        const currState = this.getCurrentState();
        const newState = stateFn(currState);
        if (currState === newState) {
            return false;
        }
        let state: S;
        if (this.isArray) {
            state = Object.assign([] as S, newState);
        } else {
            state = Object.assign({}, currState, newState);
        }
        this.state$.next(state);
        this.devToolSend(state, actionName);
        if (this.localStorageIsEnabled && this.persistentStorage) {
            this.persistentStorage.setItem<S>(this.storeName, state);
        }
        return true;
    }

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if fìdev tools are enabled
     */
    private devToolSend(newState: S | undefined, actionName?: string): boolean {
        if (!this.devToolIsEnabled || !this.devTool) {
            return false;
        }
        if (!actionName) {
            // retrive the parent (of parent) method into the stack trace
            actionName = new Error().stack
                ?.split('\n')[3]
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
    private deepFreeze(object: S | null): Readonly<S> {
        // No freezing in production (for better performance).
        if (this.devMode || !object) {
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
        Object.keys(object).forEach(key => this.deepFreeze((object as any)[key]));

        return object as Readonly<S>;
    }
}
