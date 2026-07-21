import { EnvironmentProviders, makeEnvironmentProviders, Provider } from "@angular/core";
import { NG_SIMPLE_STORE_CONFIG, NgSimpleStateConfig } from "./ng-simple-state-models";
import { NgSimpleStatePlugin, NG_SIMPLE_STATE_PLUGINS, NG_SIMPLE_STATE_UNDO_REDO } from "./plugin/ng-simple-state-plugin";

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
            providers.push(providePlugins(ngSimpleStateConfig.plugins));
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
    return providePlugins(plugins);
}

/**
 * Register a set of plugins.
 * `NG_SIMPLE_STATE_PLUGINS` is a multi token so that several calls accumulate
 * instead of overriding each other, and `undoRedoPlugin` is auto-registered on
 * its own token whichever entry point declared it.
 * @param plugins Array of plugins to register
 * @returns EnvironmentProviders
 */
function providePlugins(plugins: NgSimpleStatePlugin[]): EnvironmentProviders {
    const providers: Provider[] = plugins.map(plugin => ({
        provide: NG_SIMPLE_STATE_PLUGINS,
        useValue: plugin,
        multi: true,
    }));

    const undoRedoInstance = plugins.find(plugin => plugin.name === 'undoRedo');
    if (undoRedoInstance) {
        providers.push({
            provide: NG_SIMPLE_STATE_UNDO_REDO,
            useValue: undoRedoInstance,
        });
    }

    return makeEnvironmentProviders(providers);
}
