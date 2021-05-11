import { Injectable } from '@angular/core';

export const BASE_KEY = 'NgSimpleState::';

@Injectable({ providedIn: 'root' })
export class NgSimpleStateLocalStorage {

    private isStorageActive = false;

    constructor() {
        this.isStorageActive = !!localStorage;
    }

    /**
     * Return true if local storage is active
     * @returns True if local storage is active
     */
    isActive(): boolean {
        return this.isStorageActive;
    }

    /**
     * Set item into local storage
     * @param key key name
     * @param state state valie
     * @returns True if item is stored into local storage
     */
    setItem<K>(key: string, state: K): boolean {
        if (this.isStorageActive) {
            localStorage.setItem(BASE_KEY + key, JSON.stringify(state));
            return true;
        }
        return false;
    }

    /**
     * Return item from local storage
     * @param key key name
     * @returns the item
     */
    getItem<K>(key: string): K | null {
        if (this.isStorageActive) {
            const state = localStorage.getItem(BASE_KEY + key);
            return JSON.parse(state);
        }
        return null;
    }

    /**
     * Remove item from local storage
     * @param key key name
     * @returns True if item is removed
     */
    removeItem(key: string): boolean {
        if (this.isStorageActive) {
            localStorage.removeItem(BASE_KEY + key);
            return true;
        }
        return false;
    }
}
