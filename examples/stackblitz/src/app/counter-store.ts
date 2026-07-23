import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {
  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return { storeName: 'CounterStore' };
  }

  initialState(): CounterState {
    return { count: 0 };
  }

  selectCount(): Signal<number> {
    return this.selectState((state) => state.count);
  }

  increment(step = 1): void {
    this.setState((state) => ({ count: state.count + step }));
  }

  decrement(step = 1): void {
    this.setState((state) => ({ count: state.count - step }));
  }
}
