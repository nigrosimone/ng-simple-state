/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    NgSimpleStatePlugin, 
    NgSimpleStatePluginContext, 
    undoRedoPlugin, 
    persistPlugin 
} from './ng-simple-state-plugin';

describe('NgSimpleStatePlugin: undoRedoPlugin', () => {
    
    let plugin: ReturnType<typeof undoRedoPlugin<{ count: number }>>;
    
    beforeEach(() => {
        plugin = undoRedoPlugin<{ count: number }>({ maxHistory: 5 });
    });

    it('should have correct name', () => {
        expect(plugin.name).toBe('undoRedo');
    });

    it('should initially have no undo history', () => {
        expect(plugin.canUndo('TestStore')).toBeFalse();
        expect(plugin.undo('TestStore')).toBeNull();
    });

    it('should initially have no redo history', () => {
        expect(plugin.canRedo('TestStore')).toBeFalse();
        expect(plugin.redo('TestStore')).toBeNull();
    });

    it('should track state changes for undo', () => {
        const context: NgSimpleStatePluginContext<{ count: number }> = {
            storeName: 'TestStore',
            actionName: 'increment',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        };
        
        plugin.onAfterStateChange!(context);
        
        expect(plugin.canUndo('TestStore')).toBeTrue();
        expect(plugin.undo('TestStore')).toEqual({ count: 0 });
    });

    it('should track multiple state changes', () => {
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action1',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action2',
            prevState: { count: 1 },
            nextState: { count: 2 },
            timestamp: Date.now()
        });
        
        expect(plugin.canUndo('TestStore')).toBeTrue();
        // Most recent undo should return previous state
        expect(plugin.undo('TestStore')).toEqual({ count: 1 });
    });

    it('should respect maxHistory limit', () => {
        // Add 6 changes (maxHistory is 5)
        for (let i = 0; i < 6; i++) {
            plugin.onAfterStateChange!({
                storeName: 'TestStore',
                actionName: `action${i}`,
                prevState: { count: i },
                nextState: { count: i + 1 },
                timestamp: Date.now()
            });
        }
        
        // Oldest entry should be removed
        // The undo should return the most recent previous state
        expect(plugin.canUndo('TestStore')).toBeTrue();
    });

    it('should clear redo history on new action', () => {
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action1',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        // New action should clear redo stack
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action2',
            prevState: { count: 1 },
            nextState: { count: 2 },
            timestamp: Date.now()
        });
        
        expect(plugin.canRedo('TestStore')).toBeFalse();
    });

    it('should clear history for specific store', () => {
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action1',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        plugin.clearHistory('TestStore');
        
        expect(plugin.canUndo('TestStore')).toBeFalse();
        expect(plugin.canRedo('TestStore')).toBeFalse();
    });

    it('should handle multiple stores independently', () => {
        plugin.onAfterStateChange!({
            storeName: 'Store1',
            actionName: 'action1',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        plugin.onAfterStateChange!({
            storeName: 'Store2',
            actionName: 'action2',
            prevState: { count: 10 },
            nextState: { count: 20 },
            timestamp: Date.now()
        });
        
        expect(plugin.undo('Store1')).toEqual({ count: 0 });
        expect(plugin.undo('Store2')).toEqual({ count: 10 });
    });

    it('should clear history on store destroy', () => {
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'action1',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        plugin.onStoreDestroy!('TestStore');
        
        expect(plugin.canUndo('TestStore')).toBeFalse();
    });
});


describe('NgSimpleStatePlugin: persistPlugin', () => {
    
    it('should call save on state change', () => {
        const savedStates: Map<string, any> = new Map();
        
        const plugin = persistPlugin({
            save: (storeName, state) => savedStates.set(storeName, state),
            load: (storeName) => savedStates.get(storeName) || null
        });
        
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(savedStates.get('TestStore')).toEqual({ count: 1 });
    });

    it('should respect filter function', () => {
        const savedStates: Map<string, any> = new Map();
        
        const plugin = persistPlugin({
            save: (storeName, state) => savedStates.set(storeName, state),
            load: (storeName) => savedStates.get(storeName) || null,
            filter: (storeName) => storeName !== 'IgnoredStore'
        });
        
        plugin.onAfterStateChange!({
            storeName: 'IgnoredStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(savedStates.has('IgnoredStore')).toBeFalse();
        
        plugin.onAfterStateChange!({
            storeName: 'AllowedStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(savedStates.get('AllowedStore')).toEqual({ count: 1 });
    });
});


describe('NgSimpleStatePlugin: Custom Plugin', () => {
    
    it('should allow custom plugin implementation', () => {
        let beforeCount = 0;
        let afterCount = 0;
        let initCount = 0;
        let destroyCount = 0;
        
        const customPlugin: NgSimpleStatePlugin = {
            name: 'custom',
            onBeforeStateChange(context) {
                beforeCount++;
            },
            onAfterStateChange(context) {
                afterCount++;
            },
            onStoreInit(storeName, initialState) {
                initCount++;
            },
            onStoreDestroy(storeName) {
                destroyCount++;
            }
        };
        
        customPlugin.onStoreInit!('TestStore', { count: 0 });
        expect(initCount).toBe(1);
        
        customPlugin.onBeforeStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        expect(beforeCount).toBe(1);
        
        customPlugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        expect(afterCount).toBe(1);
        
        customPlugin.onStoreDestroy!('TestStore');
        expect(destroyCount).toBe(1);
    });

    it('should allow onBeforeStateChange to prevent state change', () => {
        const blockingPlugin: NgSimpleStatePlugin = {
            name: 'blocking',
            onBeforeStateChange(context) {
                return false; // Block all changes
            }
        };
        
        const result = blockingPlugin.onBeforeStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(result).toBeFalse();
    });
});


describe('persistPlugin', () => {
    
    it('should call save on state change', () => {
        const savedStates: { storeName: string; state: any }[] = [];
        
        const plugin = persistPlugin<{ count: number }>({
            save: (storeName, state) => {
                savedStates.push({ storeName, state });
            },
            load: () => null
        });
        
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(savedStates.length).toBe(1);
        expect(savedStates[0].storeName).toBe('TestStore');
        expect(savedStates[0].state).toEqual({ count: 1 });
    });
    
    it('should respect filter function', () => {
        const savedStates: string[] = [];
        
        const plugin = persistPlugin<{ count: number }>({
            save: (storeName) => savedStates.push(storeName),
            load: () => null,
            filter: (storeName) => storeName.startsWith('Persist')
        });
        
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        plugin.onAfterStateChange!({
            storeName: 'PersistStore',
            actionName: 'test',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(savedStates).toEqual(['PersistStore']);
    });
});


describe('undoRedoPlugin edge cases', () => {
    
    it('should use default maxHistory when not specified', () => {
        const plugin = undoRedoPlugin();
        expect(plugin.name).toBe('undoRedo');
    });
    
    it('should handle undo on empty store', () => {
        const plugin = undoRedoPlugin();
        
        expect(plugin.canUndo('EmptyStore')).toBeFalse();
        expect(plugin.undo('EmptyStore')).toBeNull();
    });
    
    it('should handle redo on empty store', () => {
        const plugin = undoRedoPlugin();
        
        expect(plugin.canRedo('EmptyStore')).toBeFalse();
        expect(plugin.redo('EmptyStore')).toBeNull();
    });
    
    it('should enable redo after undo workflow', () => {
        const plugin = undoRedoPlugin<{ count: number }>();
        
        // Initial action: count 0 -> 1
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'increment',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        expect(plugin.canUndo('TestStore')).toBeTrue();
        expect(plugin.canRedo('TestStore')).toBeFalse();
        
        // Call undo to get previous state
        const prevState = plugin.undo('TestStore');
        expect(prevState).toEqual({ count: 0 });
        
        // Simulate store applying the undo via replaceState
        // This triggers onAfterStateChange with prevState = current, nextState = undone state
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'undo',
            prevState: { count: 1 },  // state before undo
            nextState: { count: 0 },  // state after undo
            timestamp: Date.now()
        });
        
        // Now redo should be available
        expect(plugin.canRedo('TestStore')).toBeTrue();
        expect(plugin.canUndo('TestStore')).toBeFalse();
        
        // Call redo to get next state
        const nextState = plugin.redo('TestStore');
        expect(nextState).toEqual({ count: 1 });
        
        // Simulate store applying the redo via replaceState
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'redo',
            prevState: { count: 0 },  // state before redo
            nextState: { count: 1 },  // state after redo
            timestamp: Date.now()
        });
        
        // Now undo should be available again
        expect(plugin.canUndo('TestStore')).toBeTrue();
        expect(plugin.canRedo('TestStore')).toBeFalse();
    });
    
    it('should clear redo stack on new action after undo', () => {
        const plugin = undoRedoPlugin<{ count: number }>();
        
        // Action: 0 -> 1
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'increment',
            prevState: { count: 0 },
            nextState: { count: 1 },
            timestamp: Date.now()
        });
        
        // Undo: get state 0
        plugin.undo('TestStore');
        
        // Simulate store applying undo
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'undo',
            prevState: { count: 1 },
            nextState: { count: 0 },
            timestamp: Date.now()
        });
        
        expect(plugin.canRedo('TestStore')).toBeTrue();
        
        // New action (not undo/redo) should clear redo stack
        plugin.onAfterStateChange!({
            storeName: 'TestStore',
            actionName: 'newAction',
            prevState: { count: 0 },
            nextState: { count: 5 },
            timestamp: Date.now()
        });
        
        expect(plugin.canRedo('TestStore')).toBeFalse();
    });
});
