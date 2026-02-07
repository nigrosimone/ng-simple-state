/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseRxjsStore } from './ng-simple-state-base-store';
import { BASE_KEY, NgSimpleStateStorage } from '../storage/ng-simple-state-browser-storage';
import { DevToolsExtension } from '../tool/ng-simple-state-dev-tool.spec';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';
import { provideNgSimpleState } from './../ng-simple-state-provider';

export interface CounterState {
    count: number;
}

/**
 * Custom storage implementation for testing
 */
class CustomStorage extends NgSimpleStateStorage {
    constructor() {
        super(localStorage);
    }
}

@Injectable()
export class CounterStoreWithCustomStorage extends NgSimpleStateBaseRxjsStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: true,
            storeName: 'customStorageStore',
            persistentStorage: new CustomStorage()
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Observable<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.replaceState(state => ({ count: state.count - decrement }));
    }
}

@Injectable()
export class CounterStoreWithComparator extends NgSimpleStateBaseRxjsStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: false,
            storeName: 'comparatorStore',
            comparator: (previous, current) => previous.count === current.count,
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Observable<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.replaceState(state => ({ count: state.count - decrement }));
    }

    // Method to test replaceState with same count (comparator should block)
    replaceWithSameCount(): boolean {
        return this.replaceState(state => ({ count: state.count }));
    }

    // Method to test replaceState with new object but same value
    replaceWithNewObject(): boolean {
        const currentCount = this.getCurrentState().count;
        return this.replaceState({ count: currentCount });
    }
}

@Injectable()
export class CounterStoreWithCustomSerializer extends NgSimpleStateBaseRxjsStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: false,
            storeName: 'serializerStore',
            persistentStorage: 'local',
            serializeState: (state: CounterState) => `custom_${JSON.stringify(state)}`,
            deserializeState: (state: string) => JSON.parse(state.replace('custom_', ''))
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Observable<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }
}


describe('NgSimpleStateBaseRxjsStore: Custom Storage', () => {

    let service: CounterStoreWithCustomStorage;

    beforeEach(() => {
        localStorage.clear();
        (window as any)['devToolsExtension'] = new DevToolsExtension();

        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomStorage]
        });

        service = TestBed.inject(CounterStoreWithCustomStorage);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should use custom storage object', (done) => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        expect(service.increment()).toBeTrue();
        service.selectCount().subscribe(value => {
            expect(value).toBe(2);
            expect(localStorage.getItem(BASE_KEY + 'customStorageStore')).toBe(JSON.stringify({ count: 2 }));
            done();
        });
    });

    it('should load from custom storage', () => {
        localStorage.setItem(BASE_KEY + 'customStorageStore', JSON.stringify({ count: 99 }));
        
        // Create new instance to test loading from storage
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomStorage]
        });
        
        const newService = TestBed.inject(CounterStoreWithCustomStorage);
        expect(newService.getFirstState()).toEqual({ count: 99 });
    });
});


describe('NgSimpleStateBaseRxjsStore: Comparator with replaceState', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('should block replaceState when comparator returns true', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        // Try to replaceState with equivalent value (comparator should block)
        expect(service.replaceWithSameCount()).toBeFalse();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('should block replaceState with new object but same value', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        // replaceState with new object having same count - comparator should block
        expect(service.replaceWithNewObject()).toBeFalse();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('should allow replaceState when value changes', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        expect(service.decrement()).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 0 });
    });
});


describe('NgSimpleStateBaseRxjsStore: Custom Serializer', () => {

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should use custom serializeState', (done) => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomSerializer]
        });

        const service = TestBed.inject(CounterStoreWithCustomSerializer);
        expect(service.increment()).toBeTrue();
        
        service.selectCount().subscribe(value => {
            expect(value).toBe(2);
            const stored = localStorage.getItem(BASE_KEY + 'serializerStore');
            expect(stored).toBe('custom_{"count":2}');
            done();
        });
    });

    it('should use custom deserializeState', () => {
        // Pre-populate with custom format
        localStorage.setItem(BASE_KEY + 'serializerStore', 'custom_{"count":42}');
        
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomSerializer]
        });

        const service = TestBed.inject(CounterStoreWithCustomSerializer);
        expect(service.getFirstState()).toEqual({ count: 42 });
    });
});


describe('NgSimpleStateBaseRxjsStore: deepFreeze edge cases', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('deepFreeze with already frozen object', () => {
        const frozenState = Object.freeze({ count: 5 });
        
        // Access protected method via any cast
        const result = (service as any).deepFreeze(frozenState);
        
        expect(result).toEqual({ count: 5 });
        expect(Object.isFrozen(result)).toBeTrue();
    });

    it('deepFreeze with null/undefined in dev mode', () => {
        expect((service as any).devMode).toBeTrue();
        
        // deepFreeze should handle null gracefully
        const nullResult = (service as any).deepFreeze(null);
        expect(nullResult).toBeNull();
        
        // deepFreeze should handle undefined gracefully
        const undefinedResult = (service as any).deepFreeze(undefined);
        expect(undefinedResult).toBeUndefined();
    });

    it('deepFreeze with nested objects', () => {
        const nestedState = { 
            count: 1, 
            nested: { 
                value: 2,
                deep: {
                    innerValue: 3
                }
            } 
        };
        
        const result = (service as any).deepFreeze(nestedState);
        
        expect(Object.isFrozen(result)).toBeTrue();
        expect(Object.isFrozen(result.nested)).toBeTrue();
        expect(Object.isFrozen(result.nested.deep)).toBeTrue();
    });
});


describe('NgSimpleStateBaseRxjsStore: __REDUX_DEVTOOLS_EXTENSION__', () => {

    beforeEach(() => {
        // Clear any existing devtools references
        (window as any)['devToolsExtension'] = undefined;
        (window as any)['__REDUX_DEVTOOLS_EXTENSION__'] = new DevToolsExtension();
    });

    afterEach(() => {
        (window as any)['__REDUX_DEVTOOLS_EXTENSION__'] = undefined;
    });

    it('should use __REDUX_DEVTOOLS_EXTENSION__ when available', () => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: true }),
                CounterStoreWithCustomStorage
            ]
        });

        const service = TestBed.inject(CounterStoreWithCustomStorage);
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        expect(service.increment()).toBeTrue();
        expect((window as any)['__REDUX_DEVTOOLS_EXTENSION__'].name).toBe('customStorageStore.increment');
    });
});


describe('NgSimpleStateBaseRxjsStore: setState with direct object', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('setState with object (not function)', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        // setState with direct object instead of function
        const result = service.setState({ count: 5 });
        expect(result).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 5 });
    });

    it('setState with same object should not change', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        // Comparator blocks changes when count is same
        const result = service.setState({ count: 1 });
        expect(result).toBeFalse();
    });

    it('replaceState with direct object (not function)', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        const result = service.replaceState({ count: 10 });
        expect(result).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 10 });
    });

    it('selectState with custom comparator parameter', (done) => {
        const customComparator = (a: number, b: number) => a === b;
        service.selectState(state => state.count, customComparator).subscribe(value => {
            expect(value).toBe(1);
            done();
        });
    });
});


describe('NgSimpleStateBaseRxjsStore: PROD mode (devMode=false)', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('getCurrentState in PROD mode should not freeze', () => {
        // Set devMode to false to simulate production
        (service as any).devMode = false;
        
        const state = service.getCurrentState();
        expect(state).toEqual({ count: 1 });
        
        // In PROD mode, objects are not frozen
        expect(Object.isFrozen(state)).toBeFalse();
        
        // Reset
        (service as any).devMode = true;
    });
});


describe('provideNgSimpleState without arguments', () => {

    it('should return empty array when called without config', () => {
        const result = provideNgSimpleState();
        expect(result).toEqual([]);
    });

    it('should return providers when called with config', () => {
        const result = provideNgSimpleState({ enableDevTool: true });
        expect(result.length).toBe(1);
    });
});

