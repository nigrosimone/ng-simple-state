import { Inject, Injectable, Injector } from "@angular/core";
import { NgSimpleStateBaseStore, NgSimpleStateStoreConfig, NG_SIMPLE_STORE_CONFIG } from "projects/ng-simple-state/src/public-api";
import { Observable } from "rxjs";

export interface CounterState {
  count: number;
  other: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  /*
  constructor(injector: Injector, @Inject(NG_SIMPLE_STORE_CONFIG) config: NgSimpleStateStoreConfig) {
    super(injector, {
      ...config,
      storageKey: 'test',
      storeName: 'test2'
    });
  }
  **/

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
