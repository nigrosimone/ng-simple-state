import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { NG_SIMPLE_STORE_CONFIG, NgSimpleStateConfig } from "./ng-simple-state-models";
import { NgSimpleStatePlugin, NG_SIMPLE_STATE_PLUGINS } from "./plugin/ng-simple-state-plugin";

/**
 * Provide NgSimpleState with optional global configuration
 * @param {NgSimpleStateConfig} ngSimpleStateConfig 
 * @returns {EnvironmentProviders[]}
 */
export function provideNgSimpleState(ngSimpleStateConfig?: NgSimpleStateConfig): EnvironmentProviders[] {
    const providers: EnvironmentProviders[] = [];
    
    if (ngSimpleStateConfig) {
        providers.push(
            makeEnvironmentProviders([{
                provide: NG_SIMPLE_STORE_CONFIG,
                useValue: ngSimpleStateConfig,
            }])
        );
        
        // Register plugins if provided
        if (ngSimpleStateConfig.plugins && ngSimpleStateConfig.plugins.length > 0) {
            providers.push(
                makeEnvironmentProviders([{
                    provide: NG_SIMPLE_STATE_PLUGINS,
                    useValue: ngSimpleStateConfig.plugins,
                }])
            );
        }
    }
    
    return providers;
}

/**
 * Provide plugins separately (can be combined with provideNgSimpleState)
 * @param plugins Array of plugins to register
 * @returns EnvironmentProviders
 */
export function provideNgSimpleStatePlugins(plugins: NgSimpleStatePlugin[]): EnvironmentProviders {
    return makeEnvironmentProviders([{
        provide: NG_SIMPLE_STATE_PLUGINS,
        useValue: plugins,
    }]);
}
