import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';

export interface EffectsState {
  count: number;
  lastAction: string;
  history: string[];
}

@Injectable()
export class EffectsStore extends NgSimpleStateBaseSignalStore<EffectsState> {
  
  storeConfig(): NgSimpleStateStoreConfig<EffectsState> {
    return {
      storeName: 'EffectsStore'
    };
  }

  initialState(): EffectsState {
    return {
      count: 0,
      lastAction: 'init',
      history: []
    };
  }

  // Register effects in constructor (injection context)
  constructor() {
    super();
    this.setupEffects();
  }

  private setupEffects(): void {
    // Effect that logs all state changes
    this.createEffect('logger', (state) => {
      console.log('[EffectsStore] State changed:', state);
    });

    // Effect on specific selector - reacts only when count changes
    this.createSelectorEffect(
      'countWatcher',
      state => state.count,
      (count) => {
        console.log('[EffectsStore] Count is now:', count);
        // Update history when count changes
        const currentHistory = this.getCurrentState().history;
        this.setState({
          history: [...currentHistory, `Count changed to ${count}`]
        }, 'updateHistory');
      }
    );
  }

  // Selectors
  selectCount(): Signal<number> {
    return this.selectState(state => state.count);
  }

  selectLastAction(): Signal<string> {
    return this.selectState(state => state.lastAction);
  }

  selectHistory(): Signal<string[]> {
    return this.selectState(state => state.history);
  }

  // Actions
  increment(): void {
    this.setState(state => ({
      count: state.count + 1,
      lastAction: 'increment'
    }));
  }

  decrement(): void {
    this.setState(state => ({
      count: state.count - 1,
      lastAction: 'decrement'
    }));
  }

  setCount(value: number): void {
    this.setState({
      count: value,
      lastAction: `setCount(${value})`
    });
  }

  // Cleanup effects
  unregisterLoggerEffect(): void {
    this.destroyEffect('logger');
    console.log('[EffectsStore] Logger effect destroyed');
  }

  unregisterCountWatcherEffect(): void {
    this.destroyEffect('countWatcher');
    console.log('[EffectsStore] CountWatcher effect destroyed');
  }

  clearHistory(): void {
    this.setState({ history: [], lastAction: 'clearHistory' });
  }
}
