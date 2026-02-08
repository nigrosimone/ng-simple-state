import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { CounterState } from './state-model';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig } from 'ng-simple-state';


@Injectable()
export class CounterStoreRxjs extends NgSimpleStateBaseRxjsStore<CounterState> {
  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStoreRxjs'
    };
  }

  initialState(): CounterState {
    return {
      count: 0,
    };
  }

  selectCount(): Observable<number> {
    return this.selectState((state) => state.count);
  }

  increment(increment: number = 1): void {
    this.replaceState((state) => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.replaceState((state) => ({ count: state.count - decrement }));
  }
}
