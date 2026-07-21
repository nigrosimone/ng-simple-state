import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStateLocalStorage } from '../storage/ng-simple-state-local-storage';
import { BASE_KEY } from '../storage/ng-simple-state-browser-storage';

interface CounterState { count: number }

describe('Regression: storage resilience', () => {

    afterEach(() => {
        localStorage.clear();
    });

    it('should fall back to initialState() when the persisted value is corrupted', () => {
        localStorage.setItem(BASE_KEY + 'CorruptStore', '{"count":'); // truncated write

        @Injectable()
        class CorruptStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig {
                return { storeName: 'CorruptStore', persistentStorage: 'local' };
            }
            initialState(): CounterState { return { count: 0 }; }
        }

        TestBed.configureTestingModule({ providers: [CorruptStore] });

        expect(() => TestBed.inject(CorruptStore)).not.toThrow();
        expect(TestBed.inject(CorruptStore).getCurrentState()).toEqual({ count: 0 });
    });

    it('should not throw nor lose the state change when the storage write fails', () => {
        @Injectable()
        class QuotaStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig {
                return { storeName: 'QuotaStore', persistentStorage: 'local' };
            }
            initialState(): CounterState { return { count: 0 }; }
            increment(): boolean { return this.setState(state => ({ count: state.count + 1 })); }
        }

        TestBed.configureTestingModule({ providers: [QuotaStore] });
        const store = TestBed.inject(QuotaStore);

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
        try {
            expect(() => store.increment()).not.toThrow();
        } finally {
            localStorage.setItem = originalSetItem;
        }

        expect(store.getCurrentState()).toEqual({ count: 1 });
    });

    it('should report a failed write through setItem() instead of throwing', () => {
        const storage = new NgSimpleStateLocalStorage<CounterState>();

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
        try {
            expect(storage.setItem('AnyStore', { count: 1 })).toBeFalse();
        } finally {
            localStorage.setItem = originalSetItem;
        }
    });

    it('should return null from getItem() when the stored value cannot be deserialized', () => {
        localStorage.setItem(BASE_KEY + 'BadJson', 'not-json-at-all');
        const storage = new NgSimpleStateLocalStorage<CounterState>();

        expect(() => storage.getItem('BadJson')).not.toThrow();
        expect(storage.getItem('BadJson')).toBeNull();
    });

    it('should honour serializeState/deserializeState when persistentStorage is an instance', () => {
        let serialized = 0;
        let deserialized = 0;

        const config: NgSimpleStateStoreConfig<CounterState> = {
            storeName: 'CustomSerializerStore',
            persistentStorage: new NgSimpleStateLocalStorage<CounterState>(),
            serializeState: state => { serialized++; return `v1:${JSON.stringify(state)}`; },
            deserializeState: raw => { deserialized++; return JSON.parse(raw.replace(/^v1:/, '')); }
        };

        @Injectable()
        class CustomSerializerStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> { return config; }
            initialState(): CounterState { return { count: 0 }; }
            increment(): boolean { return this.setState(state => ({ count: state.count + 1 })); }
        }

        TestBed.configureTestingModule({ providers: [CustomSerializerStore] });
        TestBed.inject(CustomSerializerStore).increment();

        expect(serialized).toBeGreaterThan(0);
        expect(localStorage.getItem(BASE_KEY + 'CustomSerializerStore')).toBe('v1:{"count":1}');

        // a second store instance must be able to read that custom format back
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [CustomSerializerStore] });
        expect(TestBed.inject(CustomSerializerStore).getCurrentState()).toEqual({ count: 1 });
        expect(deserialized).toBeGreaterThan(0);
    });
});
