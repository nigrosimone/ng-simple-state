export const BASE_KEY = 'NgSimpleState::';

export abstract class NgSimpleStateBrowserStorage {

    private isStorageActive = false;

    constructor(private storage: Storage) {
        this.isStorageActive = !!storage;
    }

    /**
     * Return true if storage is active
     * @returns True if storage is active
     */
    isActive(): boolean {
        return this.isStorageActive;
    }

    /**
     * Set item into storage
     * @param key key name
     * @param state state value
     * @returns True if item is stored into storage
     */
    setItem<K>(key: string, state: K): boolean {
        if (this.isStorageActive) {
            this.storage.setItem(BASE_KEY + key, JSON.stringify(state));
            return true;
        }
        return false;
    }

    /**
     * Return item from storage
     * @param key key name
     * @returns the item
     */
    getItem<K>(key: string): K | null {
        if (this.isStorageActive) {
            const state = this.storage.getItem(BASE_KEY + key);
            if (state) {
                return JSON.parse(state);
            }
        }
        return null;
    }

    /**
     * Remove item from storage
     * @param key key name
     * @returns True if item is removed
     */
    removeItem(key: string): boolean {
        if (this.isStorageActive) {
            this.storage.removeItem(BASE_KEY + key);
            return true;
        }
        return false;
    }

    /**
     * Removes all key/value pairs, if there are any.
     * @returns True if storage is cleared
     */
    clear(): boolean {
        if (this.isStorageActive) {
            for (let i = this.storage.length; i >= 0; i--) {
                const key = this.storage.key(i);
                if (key && key.startsWith(BASE_KEY)) {
                    this.storage.removeItem(key);
                }
            }
            return true;
        }
        return false;
    }
}
