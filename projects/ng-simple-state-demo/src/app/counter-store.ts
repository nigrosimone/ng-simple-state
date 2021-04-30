import { Injectable } from "@angular/core";
import { NgSimpleStateBaseStore } from "projects/ng-simple-state/src/public-api";
import { Observable } from "rxjs";

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  initialState(): CounterState {
    return {
      count: 1
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
