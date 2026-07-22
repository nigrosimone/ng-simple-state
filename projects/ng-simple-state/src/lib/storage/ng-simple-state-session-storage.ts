import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStateStorage, resolveBrowserStorage } from './ng-simple-state-browser-storage';

export class NgSimpleStateSessionStorage<K = unknown> extends NgSimpleStateStorage<K> {
  constructor(config?: NgSimpleStateStoreConfig<K>) {
    super(resolveBrowserStorage('sessionStorage'), config);
  }
}
