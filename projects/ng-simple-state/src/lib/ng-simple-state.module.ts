import { ModuleWithProviders, NgModule } from '@angular/core';
import { NgSimpleStateConfig, NG_SIMPLE_STORE_CONFIG } from './ng-simple-state-models';

@NgModule()
/** @deprecated use `provideNgSimpleState(ngSimpleStateConfig)` */
export class NgSimpleStateModule {
    static forRoot(
        ngSimpleStateConfig?: NgSimpleStateConfig
    ): ModuleWithProviders<NgSimpleStateModule> {
        return {
            ngModule: NgSimpleStateModule,
            providers: [
                {
                    provide: NG_SIMPLE_STORE_CONFIG,
                    useValue: ngSimpleStateConfig,
                },
            ],
        };
    }
}
