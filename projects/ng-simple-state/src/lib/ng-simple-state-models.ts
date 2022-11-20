import { InjectionToken } from '@angular/core';

/**
 * NgSimpleState config option
 */
export interface NgSimpleStateConfig {
    enableDevTool?: boolean;
    enableLocalStorage?: boolean;
    persistentStorage?: 'session' | 'local';
    // eslint-disable-next-line no-unused-vars
    comparator?: <K>(previous: K, current: K) => boolean;
}

/**
 * NgSimpleState config option for store
 */
export interface NgSimpleStateStoreConfig extends NgSimpleStateConfig {
    storeName?: string;
}

/**
 * NgSimpleState config InjectionToken
 */
export const NG_SIMPLE_STORE_CONFIG = new InjectionToken<NgSimpleStateConfig>(
    'ng-simple-state.config'
);
