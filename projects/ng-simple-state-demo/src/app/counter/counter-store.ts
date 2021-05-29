import { Injectable, Injector } from '@angular/core';
import { NgSimpleStateBaseStore, NgSimpleStateStoreConfig } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
  count: number;
  other: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  constructor(injector: Injector) {
    super(injector);
  }

  storeConfig(): NgSimpleStateStoreConfig {
    return {
      storeName: 'test3',
      enableLocalStorage: true
    };
  }

  initialState(): CounterState {
    return {
      count: 1,
      other: 2
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
