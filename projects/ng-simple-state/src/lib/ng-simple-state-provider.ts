import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { NG_SIMPLE_STORE_CONFIG, NgSimpleStateConfig } from "./ng-simple-state-models";

/**
 * Provide NgSimpleState with optional global configuration
 * @param {NgSimpleStateConfig} ngSimpleStateConfig 
 * @returns {EnvironmentProviders[]}
 */
export function provideNgSimpleState(ngSimpleStateConfig?: NgSimpleStateConfig): EnvironmentProviders[] {
    if (ngSimpleStateConfig) {
        return [
            makeEnvironmentProviders([{
                provide: NG_SIMPLE_STORE_CONFIG,
                useValue: ngSimpleStateConfig,
            }])
        ];
    }
    return [];
}
