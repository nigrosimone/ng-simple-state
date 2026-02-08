/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { BASE_KEY, NgSimpleStateStorage } from '../storage/ng-simple-state-browser-storage';
import { DevToolsExtension } from '../tool/ng-simple-state-dev-tool.spec';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';
import { NgSimpleStatePlugin } from '../plugin/ng-simple-state-plugin';
import { provideNgSimpleState, provideNgSimpleStatePlugins } from '../ng-simple-state-provider';
import { NgSimpleStateDevTool } from '../tool/ng-simple-state-dev-tool';

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
        return this.setState(state => ({ count: state.count + increment }), 'increment');
    }

    decrement(decrement: number = 1): boolean {
        return this.replaceState(state => ({ count: state.count - decrement }), 'decrement');
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


describe('NgSimpleStateBaseSignalStore: produce method', () => {

    @Injectable()
    class ProduceTestStore extends NgSimpleStateBaseSignalStore<{ items: { id: number; name: string }[] }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'ProduceTestStore' };
        }

        initialState() {
            return {
                items: [
                    { id: 1, name: 'Item 1' },
                    { id: 2, name: 'Item 2' }
                ]
            };
        }

        updateItemName(id: number, name: string): boolean {
            return this.produce(draft => {
                const item = draft.items.find(i => i.id === id);
                if (item) {
                    item.name = name;
                }
            });
        }

        addItem(name: string): boolean {
            return this.produce(draft => {
                draft.items.push({ id: Date.now(), name });
            });
        }
    }

    let service: ProduceTestStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ProduceTestStore]
        });
        service = TestBed.inject(ProduceTestStore);
    });

    it('should update nested item with produce', () => {
        expect(service.updateItemName(1, 'Updated Item 1')).toBeTrue();
        
        const state = service.getCurrentState();
        expect(state.items[0].name).toBe('Updated Item 1');
        expect(state.items[1].name).toBe('Item 2');
    });

    it('should add item with produce', () => {
        expect(service.addItem('New Item')).toBeTrue();
        
        const state = service.getCurrentState();
        expect(state.items.length).toBe(3);
        expect(state.items[2].name).toBe('New Item');
    });

    it('should produce with custom action name', () => {
        const result = (service as any).produce((draft: any) => {
            draft.items[0].name = 'Custom Action';
        }, 'customAction');
        
        expect(result).toBeTrue();
    });
});


describe('NgSimpleStateBaseSignalStore: linkedState method', () => {

    @Injectable()
    class LinkedStateTestStore extends NgSimpleStateBaseSignalStore<{ count: number; multiplier: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'LinkedStateTestStore' };
        }

        initialState() {
            return { count: 5, multiplier: 2 };
        }

        setCount(count: number): void {
            this.setState({ count });
        }

        getDoubledCount() {
            return this.linkedState({
                source: state => state.count,
                computation: (count) => count * 2
            });
        }

        getCountWithMultiplier() {
            return this.linkedState({
                source: state => state.count * state.multiplier
            });
        }
    }

    let service: LinkedStateTestStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [LinkedStateTestStore]
        });
        service = TestBed.inject(LinkedStateTestStore);
    });

    it('should create linked signal with computation', () => {
        const doubled = service.getDoubledCount();
        expect(doubled()).toBe(10);
    });

    it('should create linked signal without computation', () => {
        const result = service.getCountWithMultiplier();
        expect(result()).toBe(10);
    });

    it('should update linked signal when source changes', () => {
        const doubled = service.getDoubledCount();
        expect(doubled()).toBe(10);
        
        service.setCount(10);
        expect(doubled()).toBe(20);
    });
});


describe('NgSimpleStateBaseSignalStore: effects cleanup', () => {

    @Injectable()
    class EffectsCleanupStore extends NgSimpleStateBaseSignalStore<{ count: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'EffectsCleanupStore' };
        }

        initialState() {
            return { count: 0 };
        }
    }

    let service: EffectsCleanupStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EffectsCleanupStore]
        });
        service = TestBed.inject(EffectsCleanupStore);
    });

    it('should get effect names', () => {
        expect(service.getEffectNames()).toEqual([]);
    });

    it('should destroy all effects on ngOnDestroy', () => {
        service.ngOnDestroy();
        expect(service.getEffectNames()).toEqual([]);
    });
});


describe('NgSimpleStateBaseSignalStore: plugin blocking', () => {

    @Injectable()
    class PluginBlockTestStore extends NgSimpleStateBaseSignalStore<{ count: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { 
                storeName: 'PluginBlockTestStore',
                plugins: [{
                    name: 'blocker',
                    onBeforeStateChange: (context) => {
                        // Block any change where count > 5
                        return (context.nextState as any).count <= 5;
                    }
                }]
            };
        }

        initialState() {
            return { count: 0 };
        }

        setCount(count: number): boolean {
            return this.setState({ count });
        }
    }

    let service: PluginBlockTestStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PluginBlockTestStore]
        });
        service = TestBed.inject(PluginBlockTestStore);
    });

    it('should allow state change when plugin returns true', () => {
        expect(service.setCount(3)).toBeTrue();
        expect(service.getCurrentState().count).toBe(3);
    });

    it('should block state change when plugin returns false', () => {
        expect(service.setCount(10)).toBeFalse();
        expect(service.getCurrentState().count).toBe(0);
    });

    it('should allow edge case (count = 5)', () => {
        expect(service.setCount(5)).toBeTrue();
        expect(service.getCurrentState().count).toBe(5);
    });
});


describe('NgSimpleStateBaseSignalStore: Immer with custom produce', () => {

    @Injectable()
    class ImmerProduceStore extends NgSimpleStateBaseSignalStore<{ items: number[] }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { 
                storeName: 'ImmerProduceStore',
                immerProduce: <T>(state: T, producer: (draft: T) => void): T => {
                    // Mock Immer produce - just clone and apply
                    const draft = structuredClone(state);
                    producer(draft);
                    return draft;
                }
            };
        }

        initialState() {
            return { items: [1, 2, 3] };
        }

        addItem(item: number): boolean {
            return this.produce(draft => {
                draft.items.push(item);
            });
        }
    }

    let service: ImmerProduceStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImmerProduceStore]
        });
        service = TestBed.inject(ImmerProduceStore);
    });

    it('should use custom immerProduce function', () => {
        expect(service.addItem(4)).toBeTrue();
        expect(service.getCurrentState().items).toEqual([1, 2, 3, 4]);
    });
});


describe('NgSimpleStateBaseSignalStore: replaceState', () => {

    @Injectable()
    class ReplaceStateStore extends NgSimpleStateBaseSignalStore<{ count: number; name: string }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'ReplaceStateStore' };
        }

        initialState() {
            return { count: 0, name: 'initial' };
        }

        replaceWithNew(): boolean {
            return this.replaceState({ count: 100, name: 'replaced' });
        }

        replaceWithFn(): boolean {
            return this.replaceState(state => ({ count: state.count * 2, name: 'doubled' }));
        }
    }

    let service: ReplaceStateStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ReplaceStateStore]
        });
        service = TestBed.inject(ReplaceStateStore);
    });

    it('should replace state with object', () => {
        expect(service.replaceWithNew()).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 100, name: 'replaced' });
    });

    it('should replace state with function', () => {
        service.replaceWithNew();
        expect(service.replaceWithFn()).toBeTrue();
        expect(service.getCurrentState()).toEqual({ count: 200, name: 'doubled' });
    });
});


describe('NgSimpleStateBaseSignalStore: comparator', () => {

    @Injectable()
    class ComparatorStore extends NgSimpleStateBaseSignalStore<{ count: number; timestamp: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { 
                storeName: 'ComparatorStore',
                comparator: (prev, curr) => prev.count === curr.count
            };
        }

        initialState() {
            return { count: 0, timestamp: Date.now() };
        }

        setCount(count: number): boolean {
            return this.setState({ count, timestamp: Date.now() });
        }
    }

    let service: ComparatorStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ComparatorStore]
        });
        service = TestBed.inject(ComparatorStore);
    });

    it('should detect change when count changes', () => {
        expect(service.setCount(5)).toBeTrue();
        expect(service.getCurrentState().count).toBe(5);
    });

    it('should detect no change when count stays same', () => {
        service.setCount(5);
        // Setting same count should return false due to comparator
        expect(service.setCount(5)).toBeFalse();
    });
});

describe('provideNgSimpleStatePlugins', () => {

    it('should provide plugins separately', () => {
        const plugins: NgSimpleStatePlugin[] = [
            {
                name: 'testPlugin',
                onBeforeStateChange: () => true
            }
        ];
        
        const result = provideNgSimpleStatePlugins(plugins);
        expect(result).toBeDefined();
    });
});

describe('NgSimpleStateBaseSignalStore: Plugin lifecycle hooks', () => {

    let onStoreInitSpy: jasmine.Spy;
    let onStoreDestroySpy: jasmine.Spy;
    let lifecyclePlugin: NgSimpleStatePlugin;

    @Injectable()
    class LifecyclePluginStore extends NgSimpleStateBaseSignalStore<{ value: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'LifecyclePluginStore' };
        }

        initialState() {
            return { value: 0 };
        }

        setValue(value: number): boolean {
            return this.setState({ value });
        }
    }

    beforeEach(() => {
        onStoreInitSpy = jasmine.createSpy('onStoreInit');
        onStoreDestroySpy = jasmine.createSpy('onStoreDestroy');
        
        lifecyclePlugin = {
            name: 'lifecyclePlugin',
            onStoreInit: onStoreInitSpy,
            onStoreDestroy: onStoreDestroySpy,
            onBeforeStateChange: () => true
        };

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [lifecyclePlugin] }),
                LifecyclePluginStore
            ]
        });
    });

    it('should call onStoreInit when store is created', () => {
        const service = TestBed.inject(LifecyclePluginStore);
        expect(onStoreInitSpy).toHaveBeenCalledWith('LifecyclePluginStore', { value: 0 });
    });

    it('should call onStoreDestroy when store is destroyed', () => {
        const service = TestBed.inject(LifecyclePluginStore);
        service.ngOnDestroy();
        expect(onStoreDestroySpy).toHaveBeenCalledWith('LifecyclePluginStore');
    });
});

describe('NgSimpleStateBaseSignalStore: DevTool time-travel', () => {

    let mockDevTool: any;
    let applyStateSpy: jasmine.Spy;
    let getInitialStateSpy: jasmine.Spy;

    @Injectable()
    class TimeTravelStore extends NgSimpleStateBaseSignalStore<{ count: number }> {

        storeConfig(): NgSimpleStateStoreConfig {
            return { storeName: 'TimeTravelStore', enableDevTool: true };
        }

        initialState() {
            return { count: 0 };
        }

        increment(): boolean {
            return this.setState(s => ({ count: s.count + 1 }));
        }

        applyTestState(state: { count: number }): void {
            (this as any).applyDevToolState(state);
        }
    }

    beforeEach(() => {
        applyStateSpy = jasmine.createSpy('applyState');
        getInitialStateSpy = jasmine.createSpy('getInitialState');
        
        mockDevTool = {
            send: jasmine.createSpy('send').and.returnValue(true),
            registerStore: jasmine.createSpy('registerStore').and.callFake(
                (storeName: string, callbacks: { applyState: (s: unknown) => void, getInitialState: () => unknown }) => {
                    applyStateSpy.and.callFake(callbacks.applyState);
                    getInitialStateSpy.and.callFake(callbacks.getInitialState);
                }
            ),
            unregisterStore: jasmine.createSpy('unregisterStore')
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: NgSimpleStateDevTool, useValue: mockDevTool },
                TimeTravelStore
            ]
        });
    });

    it('should register applyState callback with DevTool', () => {
        const service = TestBed.inject(TimeTravelStore);
        expect(mockDevTool.registerStore).toHaveBeenCalled();
        
        // Simulate DevTool calling applyState (time-travel)
        service.increment();
        expect(service.getCurrentState().count).toBe(1);
        
        service.applyTestState({ count: 10 });
        expect(service.getCurrentState().count).toBe(10);
    });

    it('should register getInitialState callback with DevTool', () => {
        const service = TestBed.inject(TimeTravelStore);
        expect(mockDevTool.registerStore).toHaveBeenCalled();
        
        const initialState = getInitialStateSpy();
        expect(initialState).toEqual({ count: 0 });
    });

    it('should unregister from DevTool on destroy', () => {
        const service = TestBed.inject(TimeTravelStore);
        service.ngOnDestroy();
        expect(mockDevTool.unregisterStore).toHaveBeenCalledWith('TimeTravelStore');
    });
});

