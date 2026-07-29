import { EnvironmentProviders, ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { NgSimpleStateConfig, NG_SIMPLE_STORE_CONFIG } from './ng-simple-state-models';
import { provideNgSimpleStatePlugins } from './ng-simple-state-provider';

@NgModule()
/** @deprecated use `provideNgSimpleState(ngSimpleStateConfig)` */
export class NgSimpleStateModule {
  static forRoot(
    ngSimpleStateConfig?: NgSimpleStateConfig,
  ): ModuleWithProviders<NgSimpleStateModule> {
    const providers: Array<Provider | EnvironmentProviders> = [
      {
        provide: NG_SIMPLE_STORE_CONFIG,
        useValue: ngSimpleStateConfig,
      },
    ];

    // stores read the plugins from `NG_SIMPLE_STATE_PLUGINS`, not from the
    // config object: declaring them here would otherwise be a no-op
    if (ngSimpleStateConfig?.plugins?.length) {
      providers.push(provideNgSimpleStatePlugins(ngSimpleStateConfig.plugins));
    }

    return {
      ngModule: NgSimpleStateModule,
      providers,
    };
  }
}
