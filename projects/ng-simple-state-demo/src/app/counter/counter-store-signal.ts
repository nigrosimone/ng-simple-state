import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';
import { CounterState } from './state-model';


@Injectable()
export class CounterStoreSignal extends NgSimpleStateBaseSignalStore<CounterState> {
  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStoreSignal'
    };
  }

  initialState(): CounterState {
    return {
      count: 0,
    };
  }

  selectCount(): Signal<number> {
    return this.selectState((state) => state.count);
  }

  increment(increment: number = 1): void {
    this.replaceState((state) => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.replaceState((state) => ({ count: state.count - decrement }));
  }
}
