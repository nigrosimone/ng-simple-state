import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStateDevTool } from '../tool/ng-simple-state-dev-tool';
import { BASE_KEY } from '../storage/ng-simple-state-browser-storage';
import { DevToolsExtension } from '../tool/dev-tools-extension.mock';

interface CounterState {
  count: number;
}

describe('Regression: DevTool state diff', () => {
  @Injectable()
  class DiffStore extends NgSimpleStateBaseSignalStore<CounterState> {
    protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
      return { storeName: 'DiffStore', enableDevTool: true };
    }
    initialState(): CounterState {
      return { count: 0 };
    }
    increment(): boolean {
      return this.setState((state) => ({ count: state.count + 1 }));
    }
  }

  it('should record the previous state so getLastDiff() can report a change', () => {
    TestBed.configureTestingModule({ providers: [DiffStore] });
    const store = TestBed.inject(DiffStore);
    const devTool = TestBed.inject(NgSimpleStateDevTool);

    store.increment();

    expect(devTool.getLastDiff('DiffStore')).toEqual([
      {
        path: 'count',
        type: 'changed',
        oldValue: 0,
        newValue: 1,
      },
    ]);
  });

  it('should expose prevState on the recorded history entries', () => {
    TestBed.configureTestingModule({ providers: [DiffStore] });
    const store = TestBed.inject(DiffStore);
    const devTool = TestBed.inject(NgSimpleStateDevTool);

    store.increment();
    store.increment();

    const history = devTool.getStoreHistory('DiffStore');
    const last = history[history.length - 1];
    expect(last.state).toEqual({ count: 2 });
    expect(last.prevState).toEqual({ count: 1 });
  });
});

describe('Regression: DevTool time-travel and persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should persist the state applied by a time-travel jump', () => {
    @Injectable()
    class TravelStore extends NgSimpleStateBaseSignalStore<CounterState> {
      protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
        return { storeName: 'TravelStore', enableDevTool: true, persistentStorage: 'local' };
      }
      initialState(): CounterState {
        return { count: 0 };
      }
      increment(): boolean {
        return this.setState((state) => ({ count: state.count + 1 }));
      }
    }

    TestBed.configureTestingModule({ providers: [TravelStore] });
    const store = TestBed.inject(TravelStore);
    const devTool = TestBed.inject(NgSimpleStateDevTool);

    store.increment(); // count: 1
    store.increment(); // count: 2

    const target = devTool
      .getStoreHistory('TravelStore')
      .find((entry) => (entry.state as CounterState)?.count === 1);
    expect(target).toBeDefined();

    devTool.jumpToAction(target!.id);

    expect(store.getCurrentState()).toEqual({ count: 1 });
    expect(localStorage.getItem(BASE_KEY + 'TravelStore')).toBe(JSON.stringify({ count: 1 }));
  });
});

describe('Regression: DevTool paused recording', () => {
  let extension: DevToolsExtension;

  beforeEach(() => {
    extension = new DevToolsExtension();
    (window as unknown as Record<string, unknown>)['__REDUX_DEVTOOLS_EXTENSION__'] = extension;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['__REDUX_DEVTOOLS_EXTENSION__'];
  });

  @Injectable()
  class PausedStore extends NgSimpleStateBaseSignalStore<CounterState> {
    protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
      return { storeName: 'PausedStore', enableDevTool: true };
    }
    initialState(): CounterState {
      return { count: 0 };
    }
    increment(): boolean {
      return this.setState((state) => ({ count: state.count + 1 }), 'increment');
    }
  }

  it('should stay silent when the panel recording is paused', () => {
    TestBed.configureTestingModule({ providers: [PausedStore] });
    const store = TestBed.inject(PausedStore);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      store.increment();
      expect(extension.sent.length).toBeGreaterThan(0);
      expect(log).not.toHaveBeenCalled();

      // the user presses "pause recording" in the Redux DevTools panel
      extension.dispatch('PAUSE_RECORDING');

      const sentBefore = extension.sent.length;
      store.increment();
      store.increment();

      // muting the panel must not reroute every state change to the console
      expect(extension.sent.length).toBe(sentBefore);
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }

    expect(store.getCurrentState()).toEqual({ count: 3 });
  });

  it('should fall back to the console when the extension is not installed', () => {
    delete (window as unknown as Record<string, unknown>)['__REDUX_DEVTOOLS_EXTENSION__'];

    TestBed.configureTestingModule({ providers: [PausedStore] });
    const store = TestBed.inject(PausedStore);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      store.increment();
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
