import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';

export const BASE_KEY = 'NgSimpleState::';

/**
 * Minimal in-memory `Storage`, used as a stand-in when the browser one is not
 * reachable. Keeps the store working (without persistence) instead of throwing.
 */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length(): number {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
  } as Storage;
}

/**
 * Resolve a browser `Storage` safely.
 * Falls back to an in-memory storage when it is unavailable: server side
 * rendering, storage disabled by the user, or a sandboxed iframe (which throws
 * a `SecurityError` on access).
 * @param kind the global storage name to resolve
 * @returns the browser storage, or an in-memory stand-in
 */
export function resolveBrowserStorage(kind: 'localStorage' | 'sessionStorage'): Storage {
  try {
    const storage = (globalThis as unknown as Record<string, Storage | undefined>)[kind];
    if (storage) {
      return storage;
    }
  } catch {
    /* access itself can throw when storage is blocked */
  }
  return createMemoryStorage();
}

export abstract class NgSimpleStateStorage<K = unknown> {
  /**
   * A function used to serialize the state to a string.
   */
  protected serializeState: (state: K) => string;

  /**
   * A function used to deserialize the state from a string.
   */
  protected deserializeState: (state: string) => K;

  constructor(
    protected storage: Storage,
    config?: NgSimpleStateStoreConfig<K>,
  ) {
    this.serializeState = config?.serializeState ? config.serializeState : JSON.stringify;
    this.deserializeState = config?.deserializeState ? config.deserializeState : JSON.parse;
  }

  /**
   * Return a view of this storage bound to a given store configuration.
   * A storage instance passed through `persistentStorage` is often shared by
   * several stores, so the serializers declared by one store must not be
   * applied to the others: when they differ, a bound view is returned instead
   * of mutating this instance.
   * @param config the store configuration
   * @returns this instance, or a view honouring the config serializers
   */
  withConfig(config: NgSimpleStateStoreConfig<K>): NgSimpleStateStorage<K> {
    if (!config.serializeState && !config.deserializeState) {
      return this;
    }
    const view = new NgSimpleStateStorageView<K>(this.storage);
    view.serializeState = config.serializeState ?? this.serializeState;
    view.deserializeState = config.deserializeState ?? this.deserializeState;
    return view;
  }

  /**
   * Set item into storage.
   * Never throws: a failing write (exceeded quota, private browsing, blocked
   * storage, non serializable state) must not break the state update.
   * @param key key name
   * @param state state value
   * @returns True if item is stored into storage
   */
  setItem(key: string, state: K): boolean {
    try {
      this.storage.setItem(BASE_KEY + key, this.serializeState(state));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return item from storage.
   * Never throws: a corrupted or unreadable value is treated as absent, so the
   * store falls back to its initial state instead of failing to build.
   * @param key key name
   * @returns the item, or null when missing or unreadable
   */
  getItem(key: string): K | null {
    try {
      const state = this.storage.getItem(BASE_KEY + key);
      if (state) {
        return this.deserializeState(state);
      }
    } catch {
      /* unreadable value: fall through to null */
    }
    return null;
  }

  /**
   * Remove item from storage
   * @param {string} key key name
   * @returns True if item is removed
   */
  removeItem(key: string): boolean {
    try {
      this.storage.removeItem(BASE_KEY + key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Removes all key/value pairs, if there are any.
   * @returns True if storage is cleared
   */
  clear(): boolean {
    try {
      // walk backwards: removing an entry only re-indexes the ones above it
      for (let i = this.storage.length - 1; i >= 0; i--) {
        const key = this.storage.key(i);
        if (key && key.startsWith(BASE_KEY)) {
          this.storage.removeItem(key);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Concrete storage sharing an underlying browser storage.
 * Only used by `NgSimpleStateStorage.withConfig` to bind per store serializers.
 */
class NgSimpleStateStorageView<K = unknown> extends NgSimpleStateStorage<K> {
  constructor(storage: Storage) {
    super(storage);
  }
}
