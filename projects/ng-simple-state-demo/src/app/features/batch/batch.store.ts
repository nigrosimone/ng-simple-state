import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';

export interface BatchState {
  a: number;
  b: number;
  c: number;
  updateCount: number;
  lastUpdate: string;
}

@Injectable()
export class BatchStore extends NgSimpleStateBaseSignalStore<BatchState> {
  
  storeConfig(): NgSimpleStateStoreConfig<BatchState> {
    return {
      storeName: 'BatchStore'
    };
  }

  initialState(): BatchState {
    return {
      a: 0,
      b: 0,
      c: 0,
      updateCount: 0,
      lastUpdate: 'init'
    };
  }

  // Selectors
  selectA(): Signal<number> {
    return this.selectState(state => state.a);
  }

  selectB(): Signal<number> {
    return this.selectState(state => state.b);
  }

  selectC(): Signal<number> {
    return this.selectState(state => state.c);
  }

  selectSum(): Signal<number> {
    return this.selectState(state => state.a + state.b + state.c);
  }

  selectUpdateCount(): Signal<number> {
    return this.selectState(state => state.updateCount);
  }

  selectLastUpdate(): Signal<string> {
    return this.selectState(state => state.lastUpdate);
  }

  // Individual updates (3 separate emissions)
  updateIndividually(): void {
    this.setState(s => ({ a: s.a + 1, updateCount: s.updateCount + 1, lastUpdate: 'a updated' }));
    this.setState(s => ({ b: s.b + 1, updateCount: s.updateCount + 1, lastUpdate: 'b updated' }));
    this.setState(s => ({ c: s.c + 1, updateCount: s.updateCount + 1, lastUpdate: 'c updated' }));
  }

  // Single update (1 emission)
  updateSingle(): void {
    this.setState(s => ({
      a: s.a + 1,
      b: s.b + 1,
      c: s.c + 1,
      updateCount: s.updateCount + 1,
      lastUpdate: 'all updated together'
    }));
  }

  // Actions for individual property updates
  incrementA(): void {
    this.setState(s => ({ a: s.a + 1, updateCount: s.updateCount + 1, lastUpdate: 'a++' }));
  }

  incrementB(): void {
    this.setState(s => ({ b: s.b + 1, updateCount: s.updateCount + 1, lastUpdate: 'b++' }));
  }

  incrementC(): void {
    this.setState(s => ({ c: s.c + 1, updateCount: s.updateCount + 1, lastUpdate: 'c++' }));
  }

  resetCounters(): void {
    this.setState({
      a: 0,
      b: 0,
      c: 0,
      updateCount: 0,
      lastUpdate: 'reset'
    });
  }
}
