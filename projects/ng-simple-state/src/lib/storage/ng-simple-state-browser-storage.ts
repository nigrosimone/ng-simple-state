export const BASE_KEY = 'NgSimpleState::';

export abstract class NgSimpleStateBrowserStorage {

    constructor(private storage: Storage) { }

    /**
     * Set item into storage
     * @param key key name
     * @param state state value
     * @returns True if item is stored into storage
     */
    setItem<K>(key: string, state: K): boolean {
        this.storage.setItem(BASE_KEY + key, JSON.stringify(state));
        return true;
    }

    /**
     * Return item from storage
     * @param key key name
     * @returns the item
     */
    getItem<K>(key: string): K | null {
        const state = this.storage.getItem(BASE_KEY + key);
        if (state) {
            return JSON.parse(state);
        }
        return null;
    }

    /**
     * Remove item from storage
     * @param key key name
     * @returns True if item is removed
     */
    removeItem(key: string): boolean {
        this.storage.removeItem(BASE_KEY + key);
        return true;
    }

    /**
     * Removes all key/value pairs, if there are any.
     * @returns True if storage is cleared
     */
    clear(): boolean {
        for (let i = this.storage.length; i >= 0; i--) {
            const key = this.storage.key(i);
            if (key && key.startsWith(BASE_KEY)) {
                this.storage.removeItem(key);
            }
        }
        return true;
    }
}
