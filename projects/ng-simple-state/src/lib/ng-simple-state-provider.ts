import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { NG_SIMPLE_STORE_CONFIG, NgSimpleStateConfig } from "./ng-simple-state-models";

export function provideNgSimpleState(ngSimpleStateConfig?: NgSimpleStateConfig) {
    const providers: EnvironmentProviders[] = [];
    if (ngSimpleStateConfig) {
        providers.push(makeEnvironmentProviders([{
            provide: NG_SIMPLE_STORE_CONFIG,
            useValue: ngSimpleStateConfig,
        }]));
    }
    return providers;
}
