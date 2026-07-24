import { Service, Signal } from '@angular/core';
import {
  NgSimpleStateBaseSignalStore,
  type NgSimpleStateStoreConfig,
} from 'ng-simple-state';

export interface CounterState {
  step: number;
  count: number;
}

@Service()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {
  constructor() {
    super();

    this.createEffect('logger', (state) => {
      console.log('[CounterStoreSignal] State updated:', state);
    });
  }

  storeConfig(): NgSimpleStateStoreConfig {
    return {
      storeName: 'CounterStoreSignal',
    };
  }

  initialState(): CounterState {
    return {
      step: 1,
      count: 0,
    };
  }

  selectCount(): Signal<number> {
    return this.selectState((state) => state.count);
  }

  selectStep(): Signal<number> {
    return this.selectState((state) => state.step);
  }

  increment(increment: number = 1): void {
    this.setState((state: CounterState) => ({
      ...state,
      count: state.count + increment,
    }));
  }

  decrement(decrement: number = 1): void {
    this.setState((state: CounterState) => ({
      ...state,
      count: state.count - decrement,
    }));
  }

  setStep(step: number = 1): void {
    this.setState((state: CounterState) => ({
      ...state,
      step,
    }));
  }
}
