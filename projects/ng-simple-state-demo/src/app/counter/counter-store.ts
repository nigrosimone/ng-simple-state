import { Injectable, Injector, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from '../../../../ng-simple-state/src/public-api';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

  constructor(injector: Injector) {
    super(injector);
  }

  override storeConfig(): NgSimpleStateStoreConfig {
    return {
      storeName: 'MyCounterStore',
      enableLocalStorage: true
    };
  }

  initialState(): CounterState {
    return {
      count: 0
    };
  }

  selectCount(): Signal<number> {
    return this.selectState(state => state.count);
  }

  increment(increment: number = 1): void {
    this.setState(state => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.setState(state => ({ count: state.count - decrement }));
  }
}
