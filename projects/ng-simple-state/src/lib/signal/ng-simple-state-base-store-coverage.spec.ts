/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { BASE_KEY, NgSimpleStateStorage } from '../storage/ng-simple-state-browser-storage';
import { DevToolsExtension } from '../tool/ng-simple-state-dev-tool.spec';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';

export interface CounterState {
    count: number;
}

/**
 * Custom storage implementation for testing
 */
class CustomStorage extends NgSimpleStateStorage {
    constructor() {
        super(sessionStorage);
    }
}

@Injectable()
export class CounterStoreWithCustomStorage extends NgSimpleStateBaseSignalStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: true,
            storeName: 'customStorageStoreSignal',
            persistentStorage: new CustomStorage()
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Signal<number> {
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
export class CounterStoreWithComparator extends NgSimpleStateBaseSignalStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: false,
            storeName: 'comparatorStoreSignal',
            comparator: (previous, current) => previous.count === current.count,
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Signal<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.replaceState(state => ({ count: state.count - decrement }));
    }

    replaceWithSameCount(): boolean {
        return this.replaceState(state => ({ count: state.count }));
    }

    replaceWithNewObject(): boolean {
        const currentCount = this.getCurrentState().count;
        return this.replaceState({ count: currentCount });
    }
}

@Injectable()
export class CounterStoreWithCustomSerializer extends NgSimpleStateBaseSignalStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: false,
            storeName: 'serializerStoreSignal',
            persistentStorage: 'session',
            serializeState: (state: CounterState) => `signal_${JSON.stringify(state)}`,
            deserializeState: (state: string) => JSON.parse(state.replace('signal_', ''))
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Signal<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }
}


describe('NgSimpleStateBaseSignalStore: Custom Storage', () => {

    let service: CounterStoreWithCustomStorage;

    beforeEach(() => {
        sessionStorage.clear();
        (window as any)['devToolsExtension'] = new DevToolsExtension();

        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomStorage]
        });

        service = TestBed.inject(CounterStoreWithCustomStorage);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should use custom storage object', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        expect(service.increment()).toBeTrue();
        
        const value = service.selectCount();
        expect(value()).toBe(2);
        expect(sessionStorage.getItem(BASE_KEY + 'customStorageStoreSignal')).toBe(JSON.stringify({ count: 2 }));
    });

    it('should load from custom storage', () => {
        sessionStorage.setItem(BASE_KEY + 'customStorageStoreSignal', JSON.stringify({ count: 88 }));
        
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomStorage]
        });
        
        const newService = TestBed.inject(CounterStoreWithCustomStorage);
        expect(newService.getFirstState()).toEqual({ count: 88 });
    });
});


describe('NgSimpleStateBaseSignalStore: Comparator with replaceState', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('should block replaceState when comparator returns true', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        expect(service.replaceWithSameCount()).toBeFalse();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('should block replaceState with new object but same value', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        expect(service.replaceWithNewObject()).toBeFalse();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('should allow replaceState when value changes', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        expect(service.decrement()).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 0 });
    });
});


describe('NgSimpleStateBaseSignalStore: Custom Serializer', () => {

    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should use custom serializeState', () => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomSerializer]
        });

        const service = TestBed.inject(CounterStoreWithCustomSerializer);
        expect(service.increment()).toBeTrue();
        
        const value = service.selectCount();
        expect(value()).toBe(2);
        const stored = sessionStorage.getItem(BASE_KEY + 'serializerStoreSignal');
        expect(stored).toBe('signal_{"count":2}');
    });

    it('should use custom deserializeState', () => {
        sessionStorage.setItem(BASE_KEY + 'serializerStoreSignal', 'signal_{"count":77}');
        
        TestBed.configureTestingModule({
            providers: [CounterStoreWithCustomSerializer]
        });

        const service = TestBed.inject(CounterStoreWithCustomSerializer);
        expect(service.getFirstState()).toEqual({ count: 77 });
    });
});


describe('NgSimpleStateBaseSignalStore: deepFreeze edge cases', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('deepFreeze with already frozen object', () => {
        const frozenState = Object.freeze({ count: 5 });
        
        const result = (service as any).deepFreeze(frozenState);
        
        expect(result).toEqual({ count: 5 });
        expect(Object.isFrozen(result)).toBeTrue();
    });

    it('deepFreeze with null/undefined in dev mode', () => {
        expect((service as any).devMode).toBeTrue();
        
        const nullResult = (service as any).deepFreeze(null);
        expect(nullResult).toBeNull();
        
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

    it('deepFreeze with array containing objects', () => {
        const arrayState = [
            { id: 1, name: 'test1' },
            { id: 2, name: 'test2' }
        ];
        
        const result = (service as any).deepFreeze(arrayState);
        
        expect(Object.isFrozen(result)).toBeTrue();
        expect(Object.isFrozen(result[0])).toBeTrue();
        expect(Object.isFrozen(result[1])).toBeTrue();
    });
});


describe('NgSimpleStateBaseSignalStore: __REDUX_DEVTOOLS_EXTENSION__', () => {

    beforeEach(() => {
        (window as any)['devToolsExtension'] = undefined;
        (window as any)['__REDUX_DEVTOOLS_EXTENSION__'] = new DevToolsExtension();
        sessionStorage.clear();
    });

    afterEach(() => {
        (window as any)['__REDUX_DEVTOOLS_EXTENSION__'] = undefined;
        sessionStorage.clear();
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
        expect((window as any)['__REDUX_DEVTOOLS_EXTENSION__'].name).toBe('customStorageStoreSignal.increment');
    });
});


describe('NgSimpleStateBaseSignalStore: setState with direct object', () => {

    let service: CounterStoreWithComparator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CounterStoreWithComparator]
        });

        service = TestBed.inject(CounterStoreWithComparator);
    });

    it('setState with object (not function)', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        const result = service.setState({ count: 5 });
        expect(result).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 5 });
    });

    it('setState with same object should not change', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        const result = service.setState({ count: 1 });
        expect(result).toBeFalse();
    });

    it('replaceState with direct object (not function)', () => {
        expect(service.getCurrentState()).toEqual({ count: 1 });
        
        const result = service.replaceState({ count: 10 });
        expect(result).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 10 });
    });

    it('selectState with custom comparator', () => {
        const customComparator = (a: number, b: number) => a === b;
        const value = service.selectState(state => state.count, customComparator);
        expect(value()).toBe(1);
    });
});


describe('NgSimpleStateBaseSignalStore: PROD mode (devMode=false)', () => {

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


describe('provideNgSimpleState without arguments (Signal)', () => {

    it('should return empty array when called without config', () => {
        const result = provideNgSimpleState();
        expect(result).toEqual([]);
    });
});

