import { Inject, Injectable, Optional } from "@angular/core";
import { NgSimpleStateConfig, NG_SIMPLE_STORE_CONFIG } from "./ng-simple-state-models";

export const BASE_KEY = 'NgSimpleState::';

@Injectable({ providedIn: 'root' })
export class NgSimpleStateLocalStorage {

    constructor(@Inject(NG_SIMPLE_STORE_CONFIG) @Optional() private config?: NgSimpleStateConfig) {}

    /**
     * Return true if local storage is enabled
     * @returns True if local storage is enabled
     */
    isEnabled(): boolean {
        return !!(this.config && this.config.enableLocalStorage && localStorage);
    }

    /**
    * Set item into local storage
    * @param key key name
    * @param state state valie
    * @returns True if item is stored into local storage
    */
    setItem<K>(key: string, state: K): boolean {
        if (this.isEnabled()) {
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
        if (this.isEnabled()) {
            const state = localStorage.getItem(BASE_KEY + key);
            return JSON.parse(state);
        }
        return null;
    }
}
