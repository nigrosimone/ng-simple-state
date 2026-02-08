/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { undoRedoPlugin, NG_SIMPLE_STATE_UNDO_REDO, NgSimpleStateUndoRedoPlugin, NgSimpleStateUndoRedoForStore } from './ng-simple-state-plugin';

// --- Test Store ---

interface ItemsState {
    items: string[];
    lastAction: string;
}

@Injectable()
class ItemsStore extends NgSimpleStateBaseSignalStore<ItemsState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'ItemsStore'
        };
    }

    initialState(): ItemsState {
        return {
            items: ['Item 1'],
            lastAction: 'init'
        };
    }

    selectItems(): Signal<string[]> {
        return this.selectState(state => state.items);
    }

    addItem(item: string): boolean {
        return this.setState(state => ({
            items: [...state.items, item],
            lastAction: `addItem("${item}")`
        }));
    }

    removeItem(index: number): boolean {
        return this.setState(state => ({
            items: state.items.filter((_, i) => i !== index),
            lastAction: `removeItem(${index})`
        }));
    }
}

// --- Integration Tests ---

describe('undoRedoPlugin Integration (with real store + DI)', () => {

    let store: ItemsStore;
    let plugin: ReturnType<typeof undoRedoPlugin<ItemsState>>;
    const storeName = 'ItemsStore';

    beforeEach(() => {
        plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({
                    plugins: [plugin]
                }),
                ItemsStore
            ]
        });

        store = TestBed.inject(ItemsStore);
    });

    it('should register the plugin only once (no duplicates)', () => {
        // Access internal plugins array to verify no duplicates
        const plugins = (store as any).plugins;
        const undoRedoPlugins = plugins.filter((p: any) => p.name === 'undoRedo');
        expect(undoRedoPlugins.length).toBe(1);
    });

    it('should track state changes via real store actions', () => {
        expect(plugin.canUndo(storeName)).toBeFalse();

        store.addItem('Item 2');

        expect(plugin.canUndo(storeName)).toBeTrue();
        expect(plugin.canRedo(storeName)).toBeFalse();
    });

    it('should undo a real store action and enable redo', () => {
        store.addItem('Item 2');

        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
        expect(plugin.canUndo(storeName)).toBeTrue();
        expect(plugin.canRedo(storeName)).toBeFalse();

        // Perform undo
        const prevState = plugin.undo(storeName);
        expect(prevState).toBeTruthy();
        expect(prevState!.items).toEqual(['Item 1']);

        store.replaceState(prevState!);

        expect(store.getCurrentState().items).toEqual(['Item 1']);

        // Redo should now be available
        expect(plugin.canRedo(storeName)).toBeTrue();
    });

    it('should redo after undo', () => {
        store.addItem('Item 2');

        // Undo
        const prevState = plugin.undo(storeName);
        store.replaceState(prevState!);

        expect(store.getCurrentState().items).toEqual(['Item 1']);
        expect(plugin.canRedo(storeName)).toBeTrue();

        // Redo
        const nextState = plugin.redo(storeName);
        expect(nextState).toBeTruthy();
        expect(nextState!.items).toEqual(['Item 1', 'Item 2']);

        store.replaceState(nextState!);

        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);

        // After redo, undo should be available again, redo should not
        expect(plugin.canUndo(storeName)).toBeTrue();
        expect(plugin.canRedo(storeName)).toBeFalse();
    });

    it('should support multiple undo/redo cycles', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');

        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 3']);

        // Undo once: Item 3 removed
        const state1 = plugin.undo(storeName);
        store.replaceState(state1!);
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
        expect(plugin.canRedo(storeName)).toBeTrue();

        // Undo again: Item 2 removed
        const state2 = plugin.undo(storeName);
        store.replaceState(state2!);
        expect(store.getCurrentState().items).toEqual(['Item 1']);
        expect(plugin.canRedo(storeName)).toBeTrue();

        // Redo once: Item 2 back
        const state3 = plugin.redo(storeName);
        store.replaceState(state3!);
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
        expect(plugin.canRedo(storeName)).toBeTrue();
        expect(plugin.canUndo(storeName)).toBeTrue();

        // Redo again: Item 3 back
        const state4 = plugin.redo(storeName);
        store.replaceState(state4!);
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 3']);
        expect(plugin.canRedo(storeName)).toBeFalse();
        expect(plugin.canUndo(storeName)).toBeTrue();
    });

    it('should clear redo stack when new action is performed after undo', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');

        // Undo once
        const prevState = plugin.undo(storeName);
        store.replaceState(prevState!);
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
        expect(plugin.canRedo(storeName)).toBeTrue();

        // New action should clear redo stack
        store.addItem('Item 4');
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 4']);
        expect(plugin.canRedo(storeName)).toBeFalse();
        expect(plugin.canUndo(storeName)).toBeTrue();
    });

    it('should handle undo when nothing to undo', () => {
        expect(plugin.canUndo(storeName)).toBeFalse();
        expect(plugin.undo(storeName)).toBeNull();
    });

    it('should handle redo when nothing to redo', () => {
        expect(plugin.canRedo(storeName)).toBeFalse();
        expect(plugin.redo(storeName)).toBeNull();
    });

    it('should clear history', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');

        expect(plugin.canUndo(storeName)).toBeTrue();

        plugin.clearHistory(storeName);

        expect(plugin.canUndo(storeName)).toBeFalse();
        expect(plugin.canRedo(storeName)).toBeFalse();
    });

    // --- Reactive Signal Tests ---

    it('selectCanUndo should be a reactive signal that updates on state changes', () => {
        const canUndo = plugin.selectCanUndo(storeName);

        expect(canUndo()).toBeFalse();

        store.addItem('Item 2');

        expect(canUndo()).toBeTrue();
    });

    it('selectCanRedo should be a reactive signal that updates after undo', () => {
        const canRedo = plugin.selectCanRedo(storeName);

        expect(canRedo()).toBeFalse();

        store.addItem('Item 2');
        expect(canRedo()).toBeFalse();

        // Undo
        const prevState = plugin.undo(storeName);
        store.replaceState(prevState!);

        expect(canRedo()).toBeTrue();

        // Redo
        const nextState = plugin.redo(storeName);
        store.replaceState(nextState!);

        expect(canRedo()).toBeFalse();
    });

    it('selectCanUndo/selectCanRedo should update correctly through full undo/redo cycle', () => {
        const canUndo = plugin.selectCanUndo(storeName);
        const canRedo = plugin.selectCanRedo(storeName);

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeFalse();

        // Add items
        store.addItem('Item 2');
        store.addItem('Item 3');

        expect(canUndo()).toBeTrue();
        expect(canRedo()).toBeFalse();

        // Undo
        const state1 = plugin.undo(storeName);
        store.replaceState(state1!);

        expect(canUndo()).toBeTrue();
        expect(canRedo()).toBeTrue();

        // Undo again
        const state2 = plugin.undo(storeName);
        store.replaceState(state2!);

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeTrue();

        // New action clears redo
        store.addItem('Item 4');

        expect(canUndo()).toBeTrue();
        expect(canRedo()).toBeFalse();
    });

    it('clearHistory should reset selectCanUndo/selectCanRedo signals', () => {
        const canUndo = plugin.selectCanUndo(storeName);
        const canRedo = plugin.selectCanRedo(storeName);

        store.addItem('Item 2');
        expect(canUndo()).toBeTrue();

        plugin.clearHistory(storeName);

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeFalse();
    });
});

// --- DI Token Injection Tests ---

describe('NG_SIMPLE_STATE_UNDO_REDO Token Injection', () => {

    it('should provide undoRedo plugin via NG_SIMPLE_STATE_UNDO_REDO token', () => {
        const plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [plugin] }),
                ItemsStore
            ]
        });

        const injected = TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO);
        expect(injected).toBeTruthy();
        expect(injected).toBe(plugin);
    });

    it('should return the same instance from token and from the store plugins', () => {
        const plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [plugin] }),
                ItemsStore
            ]
        });

        const store = TestBed.inject(ItemsStore);
        const injected = TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO);

        // The injected token should be the same reference as what the store uses
        const storePlugins = (store as any).plugins;
        const undoRedoInStore = storePlugins.find((p: any) => p.name === 'undoRedo');
        expect(injected).toBe(undoRedoInStore);
    });

    it('should allow injected plugin to perform undo/redo on a store', () => {
        const plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [plugin] }),
                ItemsStore
            ]
        });

        const store = TestBed.inject(ItemsStore);
        const injected = TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO) as NgSimpleStateUndoRedoPlugin<ItemsState>;
        const storeName = 'ItemsStore';

        store.addItem('Item 2');
        expect(injected.canUndo(storeName)).toBeTrue();

        const prevState = injected.undo(storeName);
        store.replaceState(prevState!);
        expect(store.getCurrentState().items).toEqual(['Item 1']);
        expect(injected.canRedo(storeName)).toBeTrue();

        const nextState = injected.redo(storeName);
        store.replaceState(nextState!);
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
    });

    it('should provide reactive signals via the injected token', () => {
        const plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [plugin] }),
                ItemsStore
            ]
        });

        const store = TestBed.inject(ItemsStore);
        const injected = TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO) as NgSimpleStateUndoRedoPlugin<ItemsState>;
        const storeName = 'ItemsStore';

        const canUndo = injected.selectCanUndo(storeName);
        const canRedo = injected.selectCanRedo(storeName);

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeFalse();

        store.addItem('Item 2');
        expect(canUndo()).toBeTrue();

        const prevState = injected.undo(storeName);
        store.replaceState(prevState!);
        expect(canRedo()).toBeTrue();
    });

    it('should not provide NG_SIMPLE_STATE_UNDO_REDO if no undoRedo plugin is configured', () => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({}),
                ItemsStore
            ]
        });

        expect(() => TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO))
            .toThrowError(/No provider/);
    });
});

// --- forStore() Tests ---

describe('undoRedoPlugin.forStore() Integration', () => {

    let store: ItemsStore;
    let plugin: NgSimpleStateUndoRedoPlugin<ItemsState>;
    let history: NgSimpleStateUndoRedoForStore<ItemsState>;

    beforeEach(() => {
        plugin = undoRedoPlugin<ItemsState>({ maxHistory: 10 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [plugin] }),
                ItemsStore
            ]
        });

        store = TestBed.inject(ItemsStore);
        history = plugin.forStore(store);
    });

    it('should bind to the correct store without needing a storeName string', () => {
        expect(history.canUndo()).toBeFalse();
        expect(history.canRedo()).toBeFalse();

        store.addItem('Item 2');

        expect(history.canUndo()).toBeTrue();
        expect(history.canRedo()).toBeFalse();
    });

    it('undo() should replace state automatically and return true', () => {
        store.addItem('Item 2');
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);

        const result = history.undo();

        expect(result).toBeTrue();
        expect(store.getCurrentState().items).toEqual(['Item 1']);
    });

    it('undo() should return false when nothing to undo', () => {
        expect(history.undo()).toBeFalse();
    });

    it('redo() should replace state automatically and return true', () => {
        store.addItem('Item 2');
        history.undo();

        expect(store.getCurrentState().items).toEqual(['Item 1']);

        const result = history.redo();

        expect(result).toBeTrue();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
    });

    it('redo() should return false when nothing to redo', () => {
        expect(history.redo()).toBeFalse();
    });

    it('should support multiple undo/redo cycles', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 3']);

        history.undo();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);

        history.undo();
        expect(store.getCurrentState().items).toEqual(['Item 1']);

        history.redo();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);

        history.redo();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 3']);
        expect(history.canRedo()).toBeFalse();
    });

    it('should clear redo stack on new action after undo', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');

        history.undo();
        expect(history.canRedo()).toBeTrue();

        store.addItem('Item 4');
        expect(history.canRedo()).toBeFalse();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2', 'Item 4']);
    });

    it('selectCanUndo/selectCanRedo should be reactive signals', () => {
        const canUndo = history.selectCanUndo();
        const canRedo = history.selectCanRedo();

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeFalse();

        store.addItem('Item 2');
        expect(canUndo()).toBeTrue();

        history.undo();
        expect(canRedo()).toBeTrue();
        expect(canUndo()).toBeFalse();

        history.redo();
        expect(canRedo()).toBeFalse();
        expect(canUndo()).toBeTrue();
    });

    it('clearHistory should reset everything', () => {
        store.addItem('Item 2');
        store.addItem('Item 3');

        const canUndo = history.selectCanUndo();
        const canRedo = history.selectCanRedo();

        expect(canUndo()).toBeTrue();

        history.clearHistory();

        expect(canUndo()).toBeFalse();
        expect(canRedo()).toBeFalse();
        expect(history.canUndo()).toBeFalse();
        expect(history.canRedo()).toBeFalse();
    });

    it('forStore via injected token should work the same way', () => {
        const injected = TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO) as NgSimpleStateUndoRedoPlugin<ItemsState>;
        const h = injected.forStore(store);

        store.addItem('Item 2');
        expect(h.canUndo()).toBeTrue();

        h.undo();
        expect(store.getCurrentState().items).toEqual(['Item 1']);
        expect(h.canRedo()).toBeTrue();

        h.redo();
        expect(store.getCurrentState().items).toEqual(['Item 1', 'Item 2']);
    });
});
