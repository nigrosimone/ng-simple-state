/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { BASE_KEY, NgSimpleStateStorage } from '../storage/ng-simple-state-browser-storage';
import { NgSimpleStatePlugin, persistPlugin } from '../plugin/ng-simple-state-plugin';

// --- User Preferences State ---

interface UserPreferencesState {
    theme: 'light' | 'dark' | 'system';
    language: string;
    fontSize: number;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    lastUpdated: number;
}

// --- Mock Storage for testing ---

class MockBrowserStorage implements Storage {
    private data = new Map<string, string>();
    
    get length(): number {
        return this.data.size;
    }
    
    clear(): void {
        this.data.clear();
    }
    
    getItem(key: string): string | null {
        return this.data.get(key) ?? null;
    }
    
    key(index: number): string | null {
        return Array.from(this.data.keys())[index] ?? null;
    }
    
    removeItem(key: string): void {
        this.data.delete(key);
    }
    
    setItem(key: string, value: string): void {
        this.data.set(key, value);
    }
}

// --- Custom Storage Implementation extending NgSimpleStateStorage ---

class InMemoryStorage<S> extends NgSimpleStateStorage<S> {
    public getItemCalls = 0;
    public setItemCalls = 0;
    public removeItemCalls = 0;
    private mockStorage = new MockBrowserStorage();

    constructor() {
        const mockStorage = new MockBrowserStorage();
        super(mockStorage);
        this.mockStorage = mockStorage;
    }

    override getItem(key: string): S | null {
        this.getItemCalls++;
        return super.getItem(key);
    }

    override setItem(key: string, value: S): boolean {
        this.setItemCalls++;
        return super.setItem(key, value);
    }

    override removeItem(key: string): boolean {
        this.removeItemCalls++;
        return super.removeItem(key);
    }

    hasItem(key: string): boolean {
        return this.mockStorage.getItem(BASE_KEY + key) !== null;
    }
}

// --- Store with Local Storage ---

@Injectable()
class LocalStoragePreferencesStore extends NgSimpleStateBaseSignalStore<UserPreferencesState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'UserPreferences',
            persistentStorage: 'local'
        };
    }

    initialState(): UserPreferencesState {
        return {
            theme: 'system',
            language: 'en',
            fontSize: 14,
            notifications: {
                email: true,
                push: true,
                sms: false
            },
            lastUpdated: Date.now()
        };
    }

    selectTheme(): Signal<UserPreferencesState['theme']> {
        return this.selectState(state => state.theme);
    }

    selectNotifications(): Signal<UserPreferencesState['notifications']> {
        return this.selectState(state => state.notifications);
    }

    setTheme(theme: UserPreferencesState['theme']): boolean {
        return this.setState({ theme, lastUpdated: Date.now() });
    }

    setLanguage(language: string): boolean {
        return this.setState({ language, lastUpdated: Date.now() });
    }

    setFontSize(fontSize: number): boolean {
        return this.setState({ fontSize, lastUpdated: Date.now() });
    }

    setNotifications(notifications: Partial<UserPreferencesState['notifications']>): boolean {
        return this.setState(state => ({
            notifications: { ...state.notifications, ...notifications },
            lastUpdated: Date.now()
        }));
    }
}

// --- Store with Session Storage ---

@Injectable()
class SessionStoragePreferencesStore extends NgSimpleStateBaseSignalStore<UserPreferencesState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'SessionPreferences',
            persistentStorage: 'session'
        };
    }

    initialState(): UserPreferencesState {
        return {
            theme: 'light',
            language: 'en',
            fontSize: 16,
            notifications: {
                email: true,
                push: false,
                sms: false
            },
            lastUpdated: Date.now()
        };
    }

    setTheme(theme: UserPreferencesState['theme']): boolean {
        return this.setState({ theme, lastUpdated: Date.now() });
    }
}

// --- Store with Custom Storage ---

let customStorageInstance: InMemoryStorage<UserPreferencesState>;

@Injectable()
class CustomStoragePreferencesStore extends NgSimpleStateBaseSignalStore<UserPreferencesState> {

    storeConfig(): NgSimpleStateStoreConfig {
        customStorageInstance = new InMemoryStorage<UserPreferencesState>();
        return {
            storeName: 'CustomPrefs',
            persistentStorage: customStorageInstance as any as NgSimpleStateStorage
        };
    }

    initialState(): UserPreferencesState {
        return {
            theme: 'dark',
            language: 'es',
            fontSize: 18,
            notifications: {
                email: false,
                push: true,
                sms: true
            },
            lastUpdated: Date.now()
        };
    }

    setTheme(theme: UserPreferencesState['theme']): boolean {
        return this.setState({ theme, lastUpdated: Date.now() });
    }

    getStorageInstance(): InMemoryStorage<UserPreferencesState> {
        return customStorageInstance;
    }
}

// --- Plugin Blocking Tests ---

interface CounterState {
    count: number;
    maxAllowed: number;
}

@Injectable()
class LimitedCounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'LimitedCounter'
        };
    }

    initialState(): CounterState {
        return {
            count: 0,
            maxAllowed: 10
        };
    }

    increment(): boolean {
        return this.setState(state => ({ count: state.count + 1 }));
    }

    setCount(count: number): boolean {
        return this.setState({ count });
    }
}

// --- Comparator Tests ---

interface DeepState {
    data: {
        nested: {
            value: number;
        };
    };
    array: number[];
}

@Injectable()
class DeepComparisonStore extends NgSimpleStateBaseSignalStore<DeepState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'DeepComparison',
            comparator: (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        };
    }

    initialState(): DeepState {
        return {
            data: {
                nested: {
                    value: 42
                }
            },
            array: [1, 2, 3]
        };
    }

    setNestedValue(value: number): boolean {
        return this.setState(() => ({
            data: {
                nested: { value }
            }
        }));
    }

    setArray(array: number[]): boolean {
        return this.setState({ array });
    }

    setSameValue(): boolean {
        return this.setState(state => ({
            data: {
                nested: { value: state.data.nested.value }
            }
        }));
    }
}

// --- Array State Tests ---

type ArrayState = Array<{ id: number; name: string }>;

@Injectable()
class ArrayStore extends NgSimpleStateBaseSignalStore<ArrayState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'ArrayStore'
        };
    }

    initialState(): ArrayState {
        return [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
        ];
    }

    addItem(name: string): boolean {
        return this.setState(state => {
            const newId = state.length > 0 ? Math.max(...state.map(i => i.id)) + 1 : 1;
            return [...state, { id: newId, name }];
        });
    }

    removeItem(id: number): boolean {
        return this.setState(state => state.filter(item => item.id !== id));
    }

    updateItem(id: number, name: string): boolean {
        return this.setState(state => 
            state.map(item => item.id === id ? { ...item, name } : item)
        );
    }

    replaceAll(items: ArrayState): boolean {
        return this.replaceState(items);
    }
}

// --- Integration Tests ---

describe('Storage Integration Tests', () => {

    describe('Local Storage', () => {

        let store: LocalStoragePreferencesStore;
        const storageKey = BASE_KEY + 'UserPreferences';

        beforeEach(() => {
            localStorage.clear();
        });

        afterEach(() => {
            localStorage.clear();
        });

        it('should persist state to localStorage on change', () => {
            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    LocalStoragePreferencesStore
                ]
            });
            store = TestBed.inject(LocalStoragePreferencesStore);

            store.setTheme('dark');

            const savedState = JSON.parse(localStorage.getItem(storageKey)!);
            expect(savedState.theme).toBe('dark');
        });

        it('should load persisted state from localStorage', () => {
            const savedState: UserPreferencesState = {
                theme: 'dark',
                language: 'fr',
                fontSize: 20,
                notifications: { email: false, push: false, sms: true },
                lastUpdated: 1234567890
            };
            localStorage.setItem(storageKey, JSON.stringify(savedState));

            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    LocalStoragePreferencesStore
                ]
            });
            store = TestBed.inject(LocalStoragePreferencesStore);

            expect(store.selectTheme()()).toBe('dark');
            expect(store.getCurrentState().language).toBe('fr');
            expect(store.getCurrentState().fontSize).toBe(20);
        });

        it('should use initial state when localStorage is empty', () => {
            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    LocalStoragePreferencesStore
                ]
            });
            store = TestBed.inject(LocalStoragePreferencesStore);

            expect(store.selectTheme()()).toBe('system');
            expect(store.getCurrentState().language).toBe('en');
        });

        it('should persist nested object changes', () => {
            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    LocalStoragePreferencesStore
                ]
            });
            store = TestBed.inject(LocalStoragePreferencesStore);

            store.setNotifications({ email: false, push: false });

            const savedState = JSON.parse(localStorage.getItem(storageKey)!);
            expect(savedState.notifications.email).toBeFalse();
            expect(savedState.notifications.push).toBeFalse();
            expect(savedState.notifications.sms).toBeFalse();
        });
    });

    describe('Session Storage', () => {

        let store: SessionStoragePreferencesStore;
        const storageKey = BASE_KEY + 'SessionPreferences';

        beforeEach(() => {
            sessionStorage.clear();
        });

        afterEach(() => {
            sessionStorage.clear();
        });

        it('should persist state to sessionStorage', () => {
            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    SessionStoragePreferencesStore
                ]
            });
            store = TestBed.inject(SessionStoragePreferencesStore);

            store.setTheme('dark');

            const savedState = JSON.parse(sessionStorage.getItem(storageKey)!);
            expect(savedState.theme).toBe('dark');
        });

        it('should load from sessionStorage', () => {
            const savedState: UserPreferencesState = {
                theme: 'dark',
                language: 'de',
                fontSize: 22,
                notifications: { email: true, push: true, sms: true },
                lastUpdated: 999999
            };
            sessionStorage.setItem(storageKey, JSON.stringify(savedState));

            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    SessionStoragePreferencesStore
                ]
            });
            store = TestBed.inject(SessionStoragePreferencesStore);

            expect(store.getCurrentState().language).toBe('de');
        });
    });

    describe('Custom Storage', () => {

        let store: CustomStoragePreferencesStore;

        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [
                    provideNgSimpleState({ enableDevTool: false }),
                    CustomStoragePreferencesStore
                ]
            });
            store = TestBed.inject(CustomStoragePreferencesStore);
        });

        it('should use custom storage implementation', () => {
            const storage = store.getStorageInstance();
            
            store.setTheme('light');
            
            expect(storage.setItemCalls).toBeGreaterThan(0);
        });

        it('should persist to custom storage', () => {
            const storage = store.getStorageInstance();
            
            store.setTheme('light');
            
            const savedState = storage.getItem('CustomPrefs');
            expect(savedState?.theme).toBe('light');
        });
    });
});

describe('Plugin Blocking Integration Tests', () => {

    it('should allow plugin to block state changes', () => {
        const blockingPlugin: NgSimpleStatePlugin<CounterState> = {
            name: 'blocker',
            onBeforeStateChange(context) {
                // Block if count would exceed max
                if (context.nextState.count > context.prevState.maxAllowed) {
                    return false;
                }
                return true;
            }
        };

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false, plugins: [blockingPlugin] }),
                LimitedCounterStore
            ]
        });
        
        const store = TestBed.inject(LimitedCounterStore);
        
        // Increment up to 10 should work
        for (let i = 0; i < 10; i++) {
            expect(store.increment()).toBeTrue();
        }
        expect(store.getCurrentState().count).toBe(10);
        
        // Increment past 10 should be blocked
        expect(store.increment()).toBeFalse();
        expect(store.getCurrentState().count).toBe(10);
    });

    it('should allow plugin to log all state changes', () => {
        const log: Array<{ action: string; prevCount: number; nextCount: number }> = [];
        
        const loggingPlugin: NgSimpleStatePlugin<CounterState> = {
            name: 'logger',
            onAfterStateChange(context) {
                log.push({
                    action: context.actionName,
                    prevCount: context.prevState.count,
                    nextCount: context.nextState.count
                });
            }
        };

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false, plugins: [loggingPlugin] }),
                LimitedCounterStore
            ]
        });
        
        const store = TestBed.inject(LimitedCounterStore);
        
        store.increment();
        store.increment();
        store.setCount(5);
        
        expect(log.length).toBe(3);
        expect(log[0]).toEqual({ action: 'increment', prevCount: 0, nextCount: 1 });
        expect(log[1]).toEqual({ action: 'increment', prevCount: 1, nextCount: 2 });
        expect(log[2]).toEqual({ action: 'setCount', prevCount: 2, nextCount: 5 });
    });

    it('should support persist plugin', () => {
        const persistedStates = new Map<string, any>();
        
        const plugin = persistPlugin<CounterState>({
            save: (storeName, state) => persistedStates.set(storeName, state),
            load: (storeName) => persistedStates.get(storeName) ?? null
        });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false, plugins: [plugin] }),
                LimitedCounterStore
            ]
        });
        
        const store = TestBed.inject(LimitedCounterStore);
        
        store.increment();
        store.increment();
        
        const saved = persistedStates.get('LimitedCounter');
        expect(saved).toBeTruthy();
        expect(saved.count).toBe(2);
    });
});

describe('Deep Comparator Integration Tests', () => {

    let store: DeepComparisonStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                DeepComparisonStore
            ]
        });
        store = TestBed.inject(DeepComparisonStore);
    });

    it('should detect deep changes', () => {
        expect(store.setNestedValue(100)).toBeTrue();
        expect(store.getCurrentState().data.nested.value).toBe(100);
    });

    it('should detect array changes', () => {
        expect(store.setArray([4, 5, 6])).toBeTrue();
        expect(store.getCurrentState().array).toEqual([4, 5, 6]);
    });

    it('should not update when values are the same', () => {
        expect(store.setSameValue()).toBeFalse();
    });

    it('should not update when setting identical array', () => {
        store.setArray([1, 2, 3]);
        // Setting same values should not trigger update
        expect(store.setArray([1, 2, 3])).toBeFalse();
    });
});

describe('Array State Integration Tests', () => {

    let store: ArrayStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                ArrayStore
            ]
        });
        store = TestBed.inject(ArrayStore);
    });

    it('should initialize with array state', () => {
        const state = store.getCurrentState();
        expect(Array.isArray(state)).toBeTrue();
        expect(state.length).toBe(2);
    });

    it('should add items to array', () => {
        store.addItem('Item 3');
        store.addItem('Item 4');
        
        const state = store.getCurrentState();
        expect(state.length).toBe(4);
        expect(state[2].name).toBe('Item 3');
        expect(state[3].id).toBe(4);
    });

    it('should remove items from array', () => {
        store.removeItem(1);
        
        const state = store.getCurrentState();
        expect(state.length).toBe(1);
        expect(state[0].id).toBe(2);
    });

    it('should update items in array', () => {
        store.updateItem(1, 'Updated Item 1');
        
        const state = store.getCurrentState();
        expect(state[0].name).toBe('Updated Item 1');
    });

    it('should replace entire array', () => {
        store.replaceAll([
            { id: 10, name: 'New Item 10' },
            { id: 20, name: 'New Item 20' }
        ]);
        
        const state = store.getCurrentState();
        expect(state.length).toBe(2);
        expect(state[0].id).toBe(10);
    });

    it('should reset array to initial state', () => {
        store.addItem('Extra');
        store.addItem('Items');
        
        store.resetState();
        
        const state = store.getCurrentState();
        expect(state.length).toBe(2);
        expect(state[0].name).toBe('Item 1');
    });
});
