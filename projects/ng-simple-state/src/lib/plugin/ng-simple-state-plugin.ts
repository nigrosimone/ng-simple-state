import { InjectionToken, signal, Signal, WritableSignal } from '@angular/core';

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
 * Store-bound undo/redo helper — no store name needed
 */
export interface NgSimpleStateUndoRedoForStore {
    /** Undo: restores the previous state on the store. Returns true if successful. */
    undo(): boolean;
    /** Redo: restores the next state on the store. Returns true if successful. */
    redo(): boolean;
    /** Whether undo is available (plain check) */
    canUndo(): boolean;
    /** Whether redo is available (plain check) */
    canRedo(): boolean;
    /** Reactive signal for canUndo */
    selectCanUndo(): Signal<boolean>;
    /** Reactive signal for canRedo */
    selectCanRedo(): Signal<boolean>;
    /** Clear undo/redo history */
    clearHistory(): void;
}

/**
 * Minimal store shape accepted by forStore (avoids circular import)
 */
export interface NgSimpleStateStoreRef<S> {
    readonly storeName: string;
    replaceState(newState: S): boolean;
}

/**
 * Type for the undoRedoPlugin instance
 */
export type NgSimpleStateUndoRedoPlugin<S = unknown> = NgSimpleStatePlugin<S> & {
    undo: (storeName: string) => S | null;
    redo: (storeName: string) => S | null;
    canUndo: (storeName: string) => boolean;
    canRedo: (storeName: string) => boolean;
    selectCanUndo: (storeName: string) => Signal<boolean>;
    selectCanRedo: (storeName: string) => Signal<boolean>;
    clearHistory: (storeName: string) => void;
    /** Returns a store-bound helper that eliminates storeName strings */
    forStore: (store: NgSimpleStateStoreRef<S>) => NgSimpleStateUndoRedoForStore;
};

/**
 * InjectionToken for the undoRedoPlugin instance
 */
export const NG_SIMPLE_STATE_UNDO_REDO = new InjectionToken<NgSimpleStateUndoRedoPlugin>(
    'ng-simple-state.undoRedo'
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
}): NgSimpleStateUndoRedoPlugin<S> {
    const maxHistory = options?.maxHistory ?? 50;
    const history: Map<string, { past: S[]; future: S[]; undoRedoMode: 'none' | 'undo' | 'redo' }> = new Map();
    const signals: Map<string, { canUndo: WritableSignal<boolean>; canRedo: WritableSignal<boolean> }> = new Map();
    
    const getOrCreate = (storeName: string) => {
        if (!history.has(storeName)) {
            history.set(storeName, { past: [], future: [], undoRedoMode: 'none' });
        }
        return history.get(storeName)!;
    };
    
    const getOrCreateSignals = (storeName: string) => {
        if (!signals.has(storeName)) {
            signals.set(storeName, { canUndo: signal(false), canRedo: signal(false) });
        }
        return signals.get(storeName)!;
    };
    
    const updateSignals = (storeName: string) => {
        const h = getOrCreate(storeName);
        const s = getOrCreateSignals(storeName);
        s.canUndo.set(h.past.length > 0);
        s.canRedo.set(h.future.length > 0);
    };
    
    return {
        name: 'undoRedo',
        
        onAfterStateChange(context) {
            const h = getOrCreate(context.storeName);
            
            if (h.undoRedoMode === 'undo') {
                // Push current state to future for redo
                h.future.push(context.prevState);
                h.undoRedoMode = 'none';
                updateSignals(context.storeName);
                return;
            }
            
            if (h.undoRedoMode === 'redo') {
                // Push current state to past for undo
                h.past.push(context.prevState);
                h.undoRedoMode = 'none';
                updateSignals(context.storeName);
                return;
            }
            
            // Normal action - record to history
            h.past.push(context.prevState);
            if (h.past.length > maxHistory) {
                h.past.shift();
            }
            h.future = []; // Clear redo stack on new action
            updateSignals(context.storeName);
        },
        
        onStoreDestroy(storeName) {
            history.delete(storeName);
            signals.delete(storeName);
        },
        
        undo(storeName: string): S | null {
            const h = getOrCreate(storeName);
            if (h.past.length === 0) {
                return null;
            }
            // Mark as undo operation
            h.undoRedoMode = 'undo';
            return h.past.pop()!;
        },
        
        redo(storeName: string): S | null {
            const h = getOrCreate(storeName);
            if (h.future.length === 0) {
                return null;
            }
            // Mark as redo operation
            h.undoRedoMode = 'redo';
            return h.future.pop()!;
        },
        
        canUndo(storeName: string): boolean {
            return getOrCreate(storeName).past.length > 0;
        },
        
        canRedo(storeName: string): boolean {
            return getOrCreate(storeName).future.length > 0;
        },
        
        selectCanUndo(storeName: string): Signal<boolean> {
            return getOrCreateSignals(storeName).canUndo.asReadonly();
        },
        
        selectCanRedo(storeName: string): Signal<boolean> {
            return getOrCreateSignals(storeName).canRedo.asReadonly();
        },
        
        clearHistory(storeName: string): void {
            history.delete(storeName);
            const s = signals.get(storeName);
            if (s) {
                s.canUndo.set(false);
                s.canRedo.set(false);
            }
        },
        
        forStore(store: NgSimpleStateStoreRef<S>): NgSimpleStateUndoRedoForStore {
            const name = store.storeName;
            return {
                undo(): boolean {
                    const h = getOrCreate(name);
                    if (h.past.length === 0) {
                        return false;
                    }
                    h.undoRedoMode = 'undo';
                    const prevState = h.past.pop()!;
                    store.replaceState(prevState);
                    return true;
                },
                redo(): boolean {
                    const h = getOrCreate(name);
                    if (h.future.length === 0) {
                        return false;
                    }
                    h.undoRedoMode = 'redo';
                    const nextState = h.future.pop()!;
                    store.replaceState(nextState);
                    return true;
                },
                canUndo(): boolean {
                    return getOrCreate(name).past.length > 0;
                },
                canRedo(): boolean {
                    return getOrCreate(name).future.length > 0;
                },
                selectCanUndo(): Signal<boolean> {
                    return getOrCreateSignals(name).canUndo.asReadonly();
                },
                selectCanRedo(): Signal<boolean> {
                    return getOrCreateSignals(name).canRedo.asReadonly();
                },
                clearHistory(): void {
                    history.delete(name);
                    const s = signals.get(name);
                    if (s) {
                        s.canUndo.set(false);
                        s.canRedo.set(false);
                    }
                }
            };
        }
    };
}
