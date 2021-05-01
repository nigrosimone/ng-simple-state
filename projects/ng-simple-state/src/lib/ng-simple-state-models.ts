import { InjectionToken } from "@angular/core";

/**
 * NgSimpleState config option
 */
export interface NgSimpleStateConfig {
    enableDevTool: boolean;
}

/**
 * NgSimpleState config InjectionToken
 */
export const NG_SIMPLE_STORE_CONFIG = new InjectionToken<NgSimpleStateConfig>(
    'ng-simple-state.config'
);
