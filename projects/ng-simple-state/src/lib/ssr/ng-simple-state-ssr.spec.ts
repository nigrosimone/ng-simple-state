import { Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { BASE_KEY, resolveBrowserStorage } from '../storage/ng-simple-state-browser-storage';
import { hasDom } from '../ng-simple-state-platform';
import { DevToolsExtension } from '../tool/dev-tools-extension.mock';

interface CounterState {
  count: number;
}

abstract class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {
  initialState(): CounterState {
    return { count: 1 };
  }

  increment(): boolean {
    return this.setState((state) => ({ count: state.count + 1 }));
  }
}

@Injectable()
class TransferStore extends CounterStore {
  protected storeConfig(): NgSimpleStateStoreConfig {
    return { storeName: 'TransferStore', transferState: true };
  }
}

@Injectable()
class PlainStore extends CounterStore {
  protected storeConfig(): NgSimpleStateStoreConfig {
    return { storeName: 'PlainStore' };
  }
}

@Injectable()
class DevToolStore extends CounterStore {
  protected storeConfig(): NgSimpleStateStoreConfig {
    return { storeName: 'DevToolStore', enableDevTool: true };
  }
}

@Injectable()
class WebMcpStore extends CounterStore {
  protected storeConfig(): NgSimpleStateStoreConfig {
    return { storeName: 'WebMcpStore', webMcp: true };
  }
}

@Injectable()
class KitchenSinkStore extends CounterStore {
  protected storeConfig(): NgSimpleStateStoreConfig {
    return {
      storeName: 'KitchenSinkStore',
      enableDevTool: true,
      webMcp: true,
      transferState: true,
      persistentStorage: 'local',
    };
  }
}

/** Run the injector on the server platform, as `platform-server` does */
const serverPlatform = { provide: PLATFORM_ID, useValue: 'server' };

const TRANSFER_KEY = makeStateKey<CounterState>(BASE_KEY + 'TransferStore');

describe('SSR: platform detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hasDom() is true under a DOM', () => {
    expect(hasDom()).toBeTrue();
  });

  it('hasDom() is false without `window`/`document`', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    expect(hasDom()).toBeFalse();
  });
});

describe('SSR: persistent storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('falls back to an in-memory storage when there is no DOM', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);

    const storage = resolveBrowserStorage('localStorage');
    storage.setItem('ssr-key', 'ssr-value');

    expect(storage.getItem('ssr-key')).toBe('ssr-value');
    // never the process wide one: it would leak into the next rendered page
    expect(localStorage.getItem('ssr-key')).toBe(null);
  });

  it('gives each resolution its own in-memory storage', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);

    const first = resolveBrowserStorage('localStorage');
    first.setItem('ssr-key', 'ssr-value');

    expect(resolveBrowserStorage('localStorage').getItem('ssr-key')).toBe(null);
  });
});

describe('SSR: dev tool', () => {
  let extension: DevToolsExtension;

  beforeEach(() => {
    extension = new DevToolsExtension();
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ = extension;
  });

  afterEach(() => {
    delete (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  });

  it('is not connected server side', () => {
    TestBed.configureTestingModule({ providers: [DevToolStore, serverPlatform] });
    const store = TestBed.inject(DevToolStore);

    expect(store.increment()).toBeTrue();
    expect(extension.name).toBe(null);
  });
});

describe('SSR: WebMCP', () => {
  let registerTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerTool = vi.fn();
    (document as any).modelContext = { registerTool };
  });

  afterEach(() => {
    delete (document as any).modelContext;
  });

  it('does not declare the tool server side', () => {
    TestBed.configureTestingModule({ providers: [WebMcpStore, serverPlatform] });

    expect(() => TestBed.inject(WebMcpStore)).not.toThrow();
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('still declares the tool in the browser', () => {
    TestBed.configureTestingModule({ providers: [WebMcpStore] });
    TestBed.inject(WebMcpStore);

    expect(registerTool).toHaveBeenCalledTimes(1);
  });
});

describe('SSR: transfer state', () => {
  it('serializes the rendered state server side', () => {
    TestBed.configureTestingModule({ providers: [TransferStore, serverPlatform] });
    const store = TestBed.inject(TransferStore);
    const transferState = TestBed.inject(TransferState);

    expect(store.increment()).toBeTrue();

    // the value is read when the page is serialized: the last rendered state
    expect(JSON.parse(transferState.toJson())[TRANSFER_KEY]).toEqual({ count: 2 });
  });

  it('hydrates the browser store from the transferred state', () => {
    TestBed.configureTestingModule({ providers: [TransferStore] });
    const transferState = TestBed.inject(TransferState);
    transferState.set(TRANSFER_KEY, { count: 42 });

    const store = TestBed.inject(TransferStore);

    expect(store.getCurrentState()).toEqual({ count: 42 });
    expect(store.getFirstState()).toEqual({ count: 42 });
    // one shot: it describes the page that has just been hydrated
    expect(transferState.hasKey(TRANSFER_KEY)).toBeFalse();
  });

  it('falls back to the initial state when nothing was transferred', () => {
    TestBed.configureTestingModule({ providers: [TransferStore] });
    const store = TestBed.inject(TransferStore);

    expect(store.getCurrentState()).toEqual({ count: 1 });
  });

  it('leaves the transferred state alone for a store that did not ask for it', () => {
    TestBed.configureTestingModule({ providers: [PlainStore] });
    const transferState = TestBed.inject(TransferState);
    transferState.set(makeStateKey<CounterState>(BASE_KEY + 'PlainStore'), { count: 42 });

    expect(TestBed.inject(PlainStore).getCurrentState()).toEqual({ count: 1 });
  });

  it('does not restart from the transferred state after the store is rebuilt', () => {
    TestBed.configureTestingModule({ providers: [TransferStore] });
    const transferState = TestBed.inject(TransferState);
    transferState.set(TRANSFER_KEY, { count: 42 });

    expect(TestBed.inject(TransferStore).getCurrentState()).toEqual({ count: 42 });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [TransferStore] });

    expect(TestBed.inject(TransferStore).getCurrentState()).toEqual({ count: 1 });
  });
});

describe('SSR: store lifecycle', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('builds and updates a fully configured store server side', () => {
    TestBed.configureTestingModule({ providers: [KitchenSinkStore, serverPlatform] });

    const store = TestBed.inject(KitchenSinkStore);
    expect(store.getCurrentState()).toEqual({ count: 1 });
    expect(store.increment()).toBeTrue();
    expect(store.getCurrentState()).toEqual({ count: 2 });
  });
});
