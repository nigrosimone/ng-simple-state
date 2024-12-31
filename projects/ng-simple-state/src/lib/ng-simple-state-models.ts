import { InjectionToken } from '@angular/core';

export type NgSimpleStateSetState<S> = (currentState: Readonly<S>) => Partial<S>;
export type NgSimpleStateSelectState<S, K> = (state: Readonly<S>) => K;
export type NgSimpleStateComparator<K> = (previous: K, current: K) => boolean;

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
     * Set the persistent storage `local` or `session`.
     */
    persistentStorage?: 'session' | 'local';
    /**
     * A function used to compare the previous and current state for equality. 
     */
    comparator?: (previous: K, current: K) => boolean;
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
