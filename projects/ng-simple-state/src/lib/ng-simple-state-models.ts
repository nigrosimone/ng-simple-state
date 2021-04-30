import { InjectionToken } from "@angular/core";

export interface NgSimpleStateConfig {
    enableDevTool: boolean;
}

export const NG_SIMPLE_STORE_CONFIG = new InjectionToken<NgSimpleStateConfig>(
    'ng-simple-state.config'
);
