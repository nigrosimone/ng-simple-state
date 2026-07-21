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
 * Install a working `localStorage`/`sessionStorage`.
 *
 * Node defines both as global getters that resolve to `undefined` unless the
 * runtime is started with `--localstorage-file`, and since jsdom shares its
 * global object with Node those getters shadow the DOM ones. Each test file
 * gets its own instance, which also keeps the specs isolated from one another.
 */
for (const name of ['localStorage', 'sessionStorage'] as const) {
    let available = false;
    try {
        available = !!globalThis[name];
    } catch {
        /* accessing the global can throw: treat it as unavailable */
    }
    if (!available) {
        Object.defineProperty(globalThis, name, {
            value: createStorage(),
            configurable: true,
            writable: true
        });
    }
}
