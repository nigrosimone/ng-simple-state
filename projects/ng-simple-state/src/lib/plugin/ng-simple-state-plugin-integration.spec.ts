/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { undoRedoPlugin } from './ng-simple-state-plugin';

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
});
