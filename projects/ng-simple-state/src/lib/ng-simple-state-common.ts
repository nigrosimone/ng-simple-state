import { Injectable, Directive, isDevMode, inject, DestroyRef, declareExperimentalWebMcpTool } from '@angular/core';
import { NgSimpleStateDevTool } from './tool/ng-simple-state-dev-tool';
import type { NgSimpleStateStorage } from './storage/ng-simple-state-browser-storage';
import { NgSimpleStateLocalStorage } from './storage/ng-simple-state-local-storage';
import { NgSimpleStateSessionStorage } from './storage/ng-simple-state-session-storage';
import { type NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG, type NgSimpleStateSetState, type NgSimpleStateComparator, type NgSimpleStateSelectState, type StateFnOrNewState, NgSimpleStateConfig, NgSimpleStateReplaceState, StateFnOrReplaceState } from './ng-simple-state-models';
import { NgSimpleStatePlugin, NG_SIMPLE_STATE_PLUGINS, NgSimpleStatePluginContext } from './plugin/ng-simple-state-plugin';


@Injectable()
@Directive()
export abstract class NgSimpleStateBaseCommonStore<S extends object | Array<unknown>> {

    private stackPoint: number = 4;
    private devTool?: NgSimpleStateDevTool;
    private storage?: NgSimpleStateStorage<S>;
    private storeName: string;
    /** @internal */
    protected _firstState!: S;
    private initState!: S;
    private isArray: boolean;
    /** @internal */
    protected _devMode: boolean = isDevMode();
    /** @internal */
    protected _comparator?: NgSimpleStateComparator<S>;
    private plugins: NgSimpleStatePlugin<S>[] = [];
    /** @internal */
    protected _immerProduce?: <T>(state: T, producer: (draft: T) => void) => T;
    /** @internal */
    protected readonly _registeredEffects: Map<string, (() => void)> = new Map();

    /**
     * Apply state directly from DevTools time-travel (bypasses devtool send and plugins).
     * Must be implemented by concrete store classes.
     * @private
     * @internal
     */
    protected abstract _applyDevToolState(state: S): void;

    constructor() {

        const globalConfig: NgSimpleStateConfig<S> | null = inject(NG_SIMPLE_STORE_CONFIG, { optional: true })
        const storeConfig = this.storeConfig();
        const config = { ...globalConfig, ...storeConfig };

        if (config.persistentStorage === 'local') {
            this.storage = new NgSimpleStateLocalStorage(config);
        } else if (config.persistentStorage === 'session') {
            this.storage = new NgSimpleStateSessionStorage(config);
        } else if (typeof config.persistentStorage === 'object') {
            this.storage = config.persistentStorage as NgSimpleStateStorage<S>;
        }

        if (config.enableDevTool) {
            this.devTool = inject(NgSimpleStateDevTool);
        }

        this.storeName = config.storeName;

        if (typeof config.comparator === 'function') {
            this._comparator = config.comparator;
        }

        // Setup Immer if configured
        if (config.immerProduce) {
            this._immerProduce = config.immerProduce;
        }

        // Setup plugins - deduplicate by reference to avoid double-registration
        const globalPlugins = inject(NG_SIMPLE_STATE_PLUGINS, { optional: true }) ?? [];
        const storePlugins = storeConfig.plugins ?? [];
        const allPlugins = [...globalPlugins, ...storePlugins];
        // Deduplicate: same plugin instance should only be registered once
        this.plugins = allPlugins.filter((plugin, index) => allPlugins.indexOf(plugin) === index) as NgSimpleStatePlugin<S>[];

        if (this.storage) {
            const firstState = this.storage.getItem(this.storeName);
            if (firstState) {
                this._firstState = firstState;
            }
        }

        this.initState = this.initialState();
        if (!this._firstState) {
            this._firstState = this.initState;
        }

        // Register with DevTool for time-travel support
        if (this.devTool) {
            this.devTool.registerStore(this.storeName, {
                applyState: (state: unknown) => this._applyDevToolState(state as S),
                getInitialState: () => this.initState
            });
        }

        this.devToolSend(this._firstState, 'initialState');

        // Notify plugins of store init
        this.notifyPluginsInit();

        this.isArray = Array.isArray(this._firstState);

        if (config.webMcp) {
            const serialize = config.serializeState || JSON.stringify;
            declareExperimentalWebMcpTool({
                name: `${this.storeName}_getCurrentState`,
                description: `Reads the current ${this.storeName} store state.`,
                inputSchema: { type: 'object', properties: {} },
                execute: () => ({
                    content: [{ type: 'text', text: serialize(this.getCurrentState()) }],
                }),
            });
        }

        inject(DestroyRef).onDestroy(() => {
            this.devToolSend(undefined, 'onDestroy');

            // Unregister from DevTool
            if (this.devTool) {
                this.devTool.unregisterStore(this.storeName);
            }

            // Notify plugins of store destroy
            for (const plugin of this.plugins) {
                if (plugin.onStoreDestroy) {
                    plugin.onStoreDestroy(this.storeName);
                }
            }

            this.destroyAllEffects();
        });
    }

    /**
     * Notify plugins of store initialization
     */
    private notifyPluginsInit(): void {
        for (const plugin of this.plugins) {
            if (plugin.onStoreInit) {
                plugin.onStoreInit(this.storeName, this._firstState);
            }
        }
    }

    /**
     * Notify plugins before state change
     * @returns false if any plugin prevents the change
     */
    private notifyPluginsBeforeChange(prevState: S, nextState: S, actionName: string): boolean {
        if (!this.plugins.length) {
            return true;
        }

        const context: NgSimpleStatePluginContext<S> = {
            storeName: this.storeName,
            actionName,
            prevState,
            nextState,
            timestamp: Date.now()
        };

        for (const plugin of this.plugins) {
            if (plugin.onBeforeStateChange) {
                const result = plugin.onBeforeStateChange(context);
                if (result === false) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Notify plugins after state change
     */
    private notifyPluginsAfterChange(prevState: S, nextState: S, actionName: string): void {
        if (!this.plugins.length) {
            return;
        }

        const context: NgSimpleStatePluginContext<S> = {
            storeName: this.storeName,
            actionName,
            prevState,
            nextState,
            timestamp: Date.now()
        };

        for (const plugin of this.plugins) {
            if (plugin.onAfterStateChange) {
                plugin.onAfterStateChange(context);
            }
        }
    }

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    protected abstract storeConfig(): NgSimpleStateStoreConfig<S>;

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
     * Replace state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    abstract replaceState(newState: S, actionName?: string): boolean;

    /**
     * Replace state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    abstract replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): boolean;

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
        return this._deepFreeze(this._firstState);
    }

    /**
     * Reset store to first loaded store state:
     *  - the last saved state
     *  - otherwise the initial state provided from `initialState()` method.
     */
    resetState(): boolean {
        return this.replaceState(this._firstState, 'resetState');
    }

    /**
     * Restart the store to initial state provided from `initialState()` method
     */
    restartState(): boolean {
        return this.replaceState(this.initState, 'restartState');
    }

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _setState(newState: Partial<S>, actionName?: string): S | undefined;
    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): S | undefined;
    /**
     * Set a new state
     * @param stateFnOrNewState State reducer or new state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _setState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): S | undefined;
    protected _setState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): S | undefined {
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
            // when working with arrays we treat payload as full replacement; avoid copying currState
            state = (newState as unknown as S);
        } else {
            // shallow merge using Object.assign (faster than spread in hot paths)
            // create a new object to avoid mutating current state
            state = Object.assign({}, currState, newState) as S;
        }

        // If comparator is provided, use it to detect equality (avoids further work)
        if (this._comparator?.(currState, state)) {
            return undefined;
        }

        const hasPlugins = this.plugins.length > 0;

        // Get action name before plugin notification
        const resolvedActionName = actionName ?? (hasPlugins ? this.getActionName() : 'no-action-needed');

        // Notify plugins before change - they can prevent the change
        if (hasPlugins && !this.notifyPluginsBeforeChange(currState as S, state, resolvedActionName)) {
            return undefined;
        }

        // avoid function call if not necessary
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.devTool && this.devToolSend(state, resolvedActionName);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.storage && this.statePersist(state);

        // Notify plugins after change
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        hasPlugins && this.notifyPluginsAfterChange(currState as S, state, resolvedActionName);

        return state;
    }

    /**
     * Get action name from stack trace
     */
    private getActionName(): string {
        if (!this._devMode && !this.plugins.length) {
            return 'no-action-needed';
        }
        try {
            return new Error().stack
                ?.split('\n')[this.stackPoint]
                ?.trim()
                ?.split(' ')[1]
                ?.split('.')[1] || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Replace state
     * @param newState state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _replaceState(newState: S, actionName?: string): S | undefined;
    /**
     * Replace state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): S | undefined;
    /**
     * Replace state
     * @param stateFnOrReplaceState State reducer or state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns state
     * @private
     * @internal
     */
    protected _replaceState(stateFnOrReplaceState: StateFnOrReplaceState<S>, actionName?: string): S | undefined;
    protected _replaceState(stateFnOrReplaceState: StateFnOrReplaceState<S>, actionName?: string): S | undefined {
        const currState = this.getCurrentState();
        let newState: S;
        if (typeof stateFnOrReplaceState === 'function') {
            newState = stateFnOrReplaceState(currState);
        } else {
            newState = stateFnOrReplaceState;
        }
        if (currState === newState) {
            return undefined;
        }
        // If comparator is provided, use it to detect equality (avoids further work)
        if (this._comparator && this._comparator(currState, newState)) {
            return undefined;
        }

        const hasPlugins = this.plugins.length > 0;

        // Get action name before plugin notification
        const resolvedActionName = actionName ?? (hasPlugins ? this.getActionName() : 'no-action-needed');

        // Notify plugins before change - they can prevent the change
        if (hasPlugins && !this.notifyPluginsBeforeChange(currState as S, newState, resolvedActionName)) {
            return undefined;
        }

        // avoid function call if not necessary
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.devTool && this.devToolSend(newState, resolvedActionName);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.storage && this.statePersist(newState);

        // Notify plugins after change
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        hasPlugins && this.notifyPluginsAfterChange(currState as S, newState, resolvedActionName);

        return newState;
    }

    /**
     * Send to dev tool a new state
     * @param newState new state
     * @param actionName The action name
     * @returns True if dev tools are enabled
     */
    private devToolSend(newState: S | undefined, actionName: string): boolean {
        if (!this.devTool) {
            return false;
        }
        if (!this.devTool.send(this.storeName, actionName, newState)) {
            /* istanbul ignore next */
            console.log(this.storeName + '.' + actionName, newState);
        }
        return true;
    }

    /**
     * Recursively Object.freeze simple Javascript structures consisting of plain objects, arrays, and primitives.
     * Make the data immutable.
     * @returns immutable object
     * @internal
     */
    protected _deepFreeze(object: S): Readonly<S> {
        // No freezing in production (for better performance).
        if (!this._devMode || !object) {
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
        Object.keys(object).forEach(key => this._deepFreeze((object as any)[key]));

        return object as Readonly<S>;
    }

    /**
     * Persist state to storage
     */
    private statePersist(state: S) {
        if (this.storage) {
            this.storage.setItem(this.storeName, state);
        }
    }

    /**
     * Destroy a specific effect by name
     * @param name Effect name to destroy
     */
    public destroyEffect(name: string): void {
        const destroyFn = this._registeredEffects.get(name);
        if (destroyFn) {
            destroyFn();
            this._registeredEffects.delete(name);
        }
    }

    /**
     * Destroy all registered effects
     */
    public destroyAllEffects(): void {
        this._registeredEffects.forEach((destroyFn) => {
            destroyFn();
        });
        this._registeredEffects.clear();
    }

    /**
     * Get all registered effect names
     */
    public getEffectNames(): string[] {
        return Array.from(this._registeredEffects.keys());
    }
}
