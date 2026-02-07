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
    // Effect that logs all state changes to console
    this.createEffect('logger', (state) => {
      console.log('[Logger Effect] State changed:', state);
    });

    // Effect that tracks count changes and updates history
    // Using queueMicrotask to break the synchronous chain and avoid infinite loop
    this.createSelectorEffect(
      'countWatcher',
      state => state.count,
      (count) => {
        console.log('[CountWatcher Effect] Count is now:', count);
        // Update history asynchronously to avoid effect loop
        queueMicrotask(() => {
          const currentHistory = this.getCurrentState().history;
          this.setState({
            history: [...currentHistory, `Count changed to ${count}`]
          }, 'historyUpdate');
        });
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

  // Actions - simple state updates, history is tracked by effect
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
    console.log('>>> Logger effect destroyed - "[Logger Effect]" messages will stop');
  }

  unregisterCountWatcherEffect(): void {
    this.destroyEffect('countWatcher');
    console.log('>>> CountWatcher effect destroyed - "[CountWatcher Effect]" messages and history updates will stop');
  }

  // Re-register effects
  registerLoggerEffect(): void {
    this.createEffect('logger', (state) => {
      console.log('[Logger Effect] State changed:', state);
    });
    console.log('>>> Logger effect registered');
  }

  registerCountWatcherEffect(): void {
    this.createSelectorEffect(
      'countWatcher',
      state => state.count,
      (count) => {
        console.log('[CountWatcher Effect] Count is now:', count);
        queueMicrotask(() => {
          const currentHistory = this.getCurrentState().history;
          this.setState({
            history: [...currentHistory, `Count changed to ${count}`]
          }, 'historyUpdate');
        });
      }
    );
    console.log('>>> CountWatcher effect registered');
  }

  clearHistory(): void {
    this.setState({ 
      history: [], 
      lastAction: 'clearHistory' 
    });
  }
}
