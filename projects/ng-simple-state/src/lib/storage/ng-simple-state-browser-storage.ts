import { NgSimpleStateStoreConfig } from "../ng-simple-state-models";

export const BASE_KEY = 'NgSimpleState::';

export abstract class NgSimpleStateStorage<K = any> {

     /**
     * A function used to serialize the state to a string.
     */
    private serializeState: (state: K) => string;
    
    /**
     * A function used to deserialize the state from a string. 
     */
    private deserializeState: (state: string) => K;

    constructor(private storage: Storage, config?: NgSimpleStateStoreConfig<K>) { 
        this.serializeState = config?.serializeState ? config.serializeState : JSON.stringify;
        this.deserializeState = config?.deserializeState ? config.deserializeState : JSON.parse;
    }

    /**
     * Set item into storage
     * @param key key name
     * @param state state value
     * @returns True if item is stored into storage
     */
    setItem(key: string, state: K): boolean {
        this.storage.setItem(BASE_KEY + key, this.serializeState(state));
        return true;
    }

    /**
     * Return item from storage
     * @param key key name
     * @returns the item
     */
    getItem(key: string): K | null {
        const state = this.storage.getItem(BASE_KEY + key);
        if (state) {
            return this.deserializeState(state);
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
