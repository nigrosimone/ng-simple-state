
import { NgSimpleStateBrowserStorage } from './ng-simple-state-browser-storage';
import { NgSimpleStateStoreConfig } from 'ng-simple-state';
export class NgSimpleStateSessionStorage<K = any> extends NgSimpleStateBrowserStorage<K> {
    constructor(config?: NgSimpleStateStoreConfig<K>) {
        super(sessionStorage, config);
    }
}
