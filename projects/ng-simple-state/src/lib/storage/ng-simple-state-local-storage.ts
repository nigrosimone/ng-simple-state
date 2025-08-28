import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStateBrowserStorage } from './ng-simple-state-browser-storage';

export class NgSimpleStateLocalStorage<K = any> extends NgSimpleStateBrowserStorage<K> {
    constructor(config?: NgSimpleStateStoreConfig<K>) {
        super(localStorage, config);
    }
}
