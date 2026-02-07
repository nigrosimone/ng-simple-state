import { InjectionToken } from '@angular/core';

/**
 * Plugin hook context containing store information
 */
export interface NgSimpleStatePluginContext<S = unknown> {
    /** Store name */
    storeName: string;
    /** Action name */
    actionName: string;
    /** Current state before change */
    prevState: Readonly<S>;
    /** New state after change */
    nextState: Readonly<S>;
    /** Timestamp of the action */
    timestamp: number;
}

/**
 * Plugin lifecycle hooks
 */
export interface NgSimpleStatePlugin<S = unknown> {
    /** Plugin name for identification */
    name: string;
    
    /**
     * Called before state change is applied
     * Return false to prevent the state change
     */
    onBeforeStateChange?(context: NgSimpleStatePluginContext<S>): boolean | void;
    
    /**
     * Called after state change is applied
     */
    onAfterStateChange?(context: NgSimpleStatePluginContext<S>): void;
    
    /**
     * Called when store is initialized
     */
    onStoreInit?(storeName: string, initialState: Readonly<S>): void;
    
    /**
     * Called when store is destroyed
     */
    onStoreDestroy?(storeName: string): void;
}

/**
 * Plugin configuration
 */
export interface NgSimpleStatePluginConfig {
    plugins: NgSimpleStatePlugin[];
}

/**
 * InjectionToken for plugins
 */
export const NG_SIMPLE_STATE_PLUGINS = new InjectionToken<NgSimpleStatePlugin[]>(
    'ng-simple-state.plugins'
);

/**
 * Persist plugin - custom persistence logic
 */
export function persistPlugin<S>(options: {
    save: (storeName: string, state: S) => void;
    load: (storeName: string) => S | null;
    filter?: (storeName: string) => boolean;
}): NgSimpleStatePlugin<S> {
    return {
        name: 'persist',
        onAfterStateChange(context) {
            if (options.filter && !options.filter(context.storeName)) {
                return;
            }
            options.save(context.storeName, context.nextState);
        }
    };
}

/**
 * Undo/Redo plugin - enables state history
 */
export function undoRedoPlugin<S>(options?: {
    maxHistory?: number;
}): NgSimpleStatePlugin<S> & {
    undo: (storeName: string) => S | null;
    redo: (storeName: string) => S | null;
    canUndo: (storeName: string) => boolean;
    canRedo: (storeName: string) => boolean;
    clearHistory: (storeName: string) => void;
} {
    const maxHistory = options?.maxHistory ?? 50;
    const history: Map<string, { past: S[]; future: S[] }> = new Map();
    
    const getOrCreate = (storeName: string) => {
        if (!history.has(storeName)) {
            history.set(storeName, { past: [], future: [] });
        }
        return history.get(storeName)!;
    };
    
    return {
        name: 'undoRedo',
        
        onAfterStateChange(context) {
            const h = getOrCreate(context.storeName);
            h.past.push(context.prevState);
            if (h.past.length > maxHistory) {
                h.past.shift();
            }
            h.future = []; // Clear redo stack on new action
        },
        
        onStoreDestroy(storeName) {
            history.delete(storeName);
        },
        
        undo(storeName: string): S | null {
            const h = getOrCreate(storeName);
            if (h.past.length === 0) {
                return null;
            }
            return h.past[h.past.length - 1];
        },
        
        redo(storeName: string): S | null {
            const h = getOrCreate(storeName);
            if (h.future.length === 0) {
                return null;
            }
            return h.future[h.future.length - 1];
        },
        
        canUndo(storeName: string): boolean {
            return getOrCreate(storeName).past.length > 0;
        },
        
        canRedo(storeName: string): boolean {
            return getOrCreate(storeName).future.length > 0;
        },
        
        clearHistory(storeName: string): void {
            history.delete(storeName);
        }
    };
}
