import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStateStorage } from './ng-simple-state-browser-storage';

export class NgSimpleStateLocalStorage<K = unknown> extends NgSimpleStateStorage<K> {
    constructor(config?: NgSimpleStateStoreConfig<K>) {
        super(localStorage, config);
    }
}
