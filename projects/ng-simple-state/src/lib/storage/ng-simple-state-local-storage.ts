import { Injectable } from '@angular/core';
import { NgSimpleStateBrowserStorage } from './ng-simple-state-browser-storage';

@Injectable({ providedIn: 'root' })
export class NgSimpleStateLocalStorage extends NgSimpleStateBrowserStorage {
    constructor() {
        super(localStorage);
    }
}
