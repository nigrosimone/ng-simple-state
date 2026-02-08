import { InjectionToken } from '@angular/core';
import type { NgSimpleStateStorage } from './storage/ng-simple-state-browser-storage';
import type { NgSimpleStatePlugin } from './plugin/ng-simple-state-plugin';

export type NgSimpleStateReplaceState<S> = (currentState: Readonly<S>) => S;
export type NgSimpleStateSetState<S> = (currentState: Readonly<S>) => Partial<S>;
export type NgSimpleStateSelectState<S, K> = (state: Readonly<S>) => K;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type NgSimpleStateComparator<K = any> = (previous: K, current: K) => boolean;

/**
 * Immer-style producer function for immutable updates
 */
export type NgSimpleStateProducer<S> = (draft: S) => void | S;

/**
 * LinkedSignal options for derived state
 */
export interface NgSimpleStateLinkedOptions<S, K> {
    /** Selector function to derive state */
    source: (state: S) => K;
    /** Computation function for derived value */
    computation?: (source: K, previous?: K) => K;
    /** Equality function */
    equal?: (a: K, b: K) => boolean;
}

/**
 * NgSimpleState config option
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface NgSimpleStateConfig<K = any> {
    /**
     * if `true` enable `Redux DevTools` browser extension for inspect the state of the store.
     */
    enableDevTool?: boolean;
    /**
     * Set the persistent storage `local`, `session` or instance of `NgSimpleStateStorage`.
     */
    persistentStorage?: 'session' | 'local' | NgSimpleStateStorage;
    /**
     * A function used to compare the previous and current state for equality. 
     */
    comparator?: NgSimpleStateComparator<K>;
    /**
     * A function used to serialize the state to a string.
     */
    serializeState?: (state: K) => string;
    /**
     * A function used to deserialize the state from a string. 
     */
    deserializeState?: (state: string) => K;
    /**
     * Immer produce function (optional, for custom Immer integration)
     * Import from 'immer' and provide here
     */
    immerProduce?: <S>(state: S, producer: (draft: S) => void) => S;
    /**
     * Plugins for extending store functionality
     */
    plugins?: NgSimpleStatePlugin[];
}

/**
 * NgSimpleState config option for store
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface NgSimpleStateStoreConfig<K = any> extends NgSimpleStateConfig<K> {
    /** 
     * The store name 
     */
    storeName: string;
}

/**
 * NgSimpleState config InjectionToken
 */
export const NG_SIMPLE_STORE_CONFIG = new InjectionToken<NgSimpleStateConfig>(
    'ng-simple-state.config'
);

export type StateFnOrNewState<S> = Partial<S> | NgSimpleStateSetState<S>;
export type StateFnOrReplaceState<S> = S | NgSimpleStateReplaceState<S>;
