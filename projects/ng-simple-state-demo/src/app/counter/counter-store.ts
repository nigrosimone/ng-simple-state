import { Injectable, Injector } from '@angular/core';
import { NgSimpleStateBaseStore, NgSimpleStateStoreConfig } from '../../../../ng-simple-state/src/public-api';
import { Observable } from 'rxjs';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

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

  selectCount(): Observable<number> {
    return this.selectState(state => state.count);
  }

  increment(increment: number = 1): void {
    this.setState(state => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.setState(state => ({ count: state.count - decrement }));
  }
}
