import { expect } from 'vitest';

declare module 'vitest' {
    interface Matchers<T = any> {
        toBeTrue(): T;
        toBeFalse(): T;
    }
}

/**
 * Jasmine flavoured boolean matchers.
 *
 * Vitest has no `toBeTrue`/`toBeFalse`: registering them here keeps the specs
 * readable without giving up the strict identity check they imply.
 */
expect.extend({
    toBeTrue(received: unknown) {
        return {
            pass: received === true,
            message: () => `expected ${this.utils.printReceived(received)} to be true`
        };
    },
    toBeFalse(received: unknown) {
        return {
            pass: received === false,
            message: () => `expected ${this.utils.printReceived(received)} to be false`
        };
    }
});

/**
 * Minimal in-memory `Storage`, spec faithful for what the library uses.
 */
function createStorage(): Storage {
    const data = new Map<string, string>();
    return {
        get length(): number { return data.size; },
        clear: () => { data.clear(); },
        getItem: (key: string) => data.has(key) ? data.get(key) as string : null,
        key: (index: number) => Array.from(data.keys())[index] ?? null,
        removeItem: (key: string) => { data.delete(key); },
        setItem: (key: string, value: string) => { data.set(String(key), String(value)); }
    } as Storage;
}

/**
 * Install `localStorage`/`sessionStorage`, unconditionally.
 *
 * Whether a usable one already exists depends on the Node version: recent
 * releases define both as global getters that resolve to `undefined` unless
 * started with `--localstorage-file`, and since jsdom shares its global object
 * with Node those getters shadow the DOM ones. Installing them only when missing
 * therefore makes the specs run against a plain object on one machine and a real
 * `Storage` on another — and the two do not behave alike, a real one turning
 * `localStorage.setItem = fn` into `setItem('setItem', fn)` through its named
 * property setter.
 *
 * Always installing the same implementation keeps developers and CI in
 * agreement, and gives each test file its own isolated storage.
 */
for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, name, {
        value: createStorage(),
        configurable: true,
        writable: true
    });
}
