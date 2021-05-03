import { InjectionToken } from "@angular/core";

/**
 * NgSimpleState config option
 */
export interface NgSimpleStateConfig {
    enableDevTool?: boolean;
    enableLocalStorage?: boolean;
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
