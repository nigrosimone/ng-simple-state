import { inject, Injectable, NgZone, Signal, signal, WritableSignal } from '@angular/core';

/**
 * State history entry for time-travel debugging
 */
export interface StateHistoryEntry<S = unknown> {
    /** Unique id */
    id: number;
    /** Store name */
    storeName: string;
    /** Action name */
    actionName: string;
    /** State snapshot */
    state: S;
    /** Previous state */
    prevState?: S;
    /** Timestamp */
    timestamp: number;
}

/**
 * State diff result
 */
export interface StateDiff {
    path: string;
    type: 'added' | 'removed' | 'changed';
    oldValue?: unknown;
    newValue?: unknown;
}

/**
 * Reference to a store for DevTools time-travel.
 * Used internally to push state changes from DevTools back to stores.
 */
export interface DevToolsStoreRef {
    /** Apply a state directly to the store (bypasses devtool send and plugins) */
    applyState: (state: unknown) => void;
    /** Get the initial state of the store */
    getInitialState: () => unknown;
}

interface DevToolsMessage {
    type: string;
    payload?: {
        type?: string;
        actionId?: number;
        index?: number;
        id?: number;
    };
    state?: string;
}

// Get Redux DevTools extension from window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getReduxDevTools(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    return win.__REDUX_DEVTOOLS_EXTENSION__ ?? win.devToolsExtension;
}

@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly globalDevtools: any = getReduxDevTools();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private localDevTool: any;
    private readonly baseState: Record<string, unknown> = {};
    
    /** Registry of active stores for time-travel */
    private readonly stores = new Map<string, DevToolsStoreRef>();
    
    /** Flag to prevent feedback loops during time-travel */
    private isTimeTraveling = false;
    
    /** History of all state changes */
    private readonly historyEntries: StateHistoryEntry[] = [];
    private historyIdCounter = 0;
    private readonly maxHistorySize = 100;
    
    /** Current history position for time-travel */
    private readonly currentPositionSig: WritableSignal<number> = signal(-1);
    
    /** Paused state - when true, state changes are not recorded */
    private readonly isPausedSig: WritableSignal<boolean> = signal(false);
    
    /** Legacy callback for time-travel jumps (deprecated, use store registry) */
    private jumpCallback?: (storeName: string, state: unknown) => void;
    
    constructor() {
        if (this.globalDevtools) {
            inject(NgZone).runOutsideAngular(() => {
                this.localDevTool = this.globalDevtools!.connect({
                    name: 'NgSimpleState',
                    features: {
                        pause: true,
                        lock: false,
                        persist: true,
                        export: true,
                        import: 'custom',
                        jump: true,
                        skip: true,
                        reorder: false,
                        dispatch: false
                    }
                });
                
                if (this.localDevTool) {
                    this.localDevTool.init(this.baseState);
                    this.subscribeToDevTools();
                }
            });
        }
    }
    
    /**
     * Register a store for time-travel support.
     * Called automatically by stores when enableDevTool is true.
     */
    registerStore(storeName: string, ref: DevToolsStoreRef): void {
        this.stores.set(storeName, ref);
    }
    
    /**
     * Unregister a store (called on store destroy).
     */
    unregisterStore(storeName: string): void {
        this.stores.delete(storeName);
    }
    
    /**
     * Subscribe to DevTools events for time-travel
     */
    private subscribeToDevTools(): void {
        if (!this.localDevTool?.subscribe) {
            return;
        }
        
        this.localDevTool.subscribe((message: DevToolsMessage) => {
            if (message.type === 'DISPATCH') {
                switch (message.payload?.type) {
                    case 'JUMP_TO_STATE':
                    case 'JUMP_TO_ACTION':
                        this.applyStateFromDevTools(message.state);
                        break;
                    case 'TOGGLE_ACTION':
                        // Skip/un-skip: DevTools recomputes state, we just apply it
                        this.applyStateFromDevTools(message.state);
                        break;
                    case 'RESET':
                        this.handleReset();
                        break;
                    case 'ROLLBACK':
                        this.handleRollback(message.state);
                        break;
                    case 'COMMIT':
                        this.handleCommit();
                        break;
                    case 'IMPORT_STATE':
                        if (message.state) {
                            this.importState(message.state);
                        }
                        break;
                    case 'PAUSE_RECORDING':
                        this.isPausedSig.update(v => !v);
                        break;
                }
            }
        });
    }
    
    /**
     * Apply state from Redux DevTools message.
     * Parses JSON state and pushes it to all registered stores.
     */
    private applyStateFromDevTools(stateJson?: string): void {
        if (!stateJson) {
            return;
        }
        try {
            const state = JSON.parse(stateJson);
            this.isTimeTraveling = true;
            for (const [storeName, storeRef] of this.stores) {
                if (state[storeName] !== undefined) {
                    storeRef.applyState(state[storeName]);
                }
            }
            Object.assign(this.baseState, state);
        } catch (e) {
            console.error('NgSimpleState: Failed to apply DevTools state:', e);
        } finally {
            this.isTimeTraveling = false;
        }
    }
    
    /**
     * Handle RESET: restore all stores to initial state
     */
    private handleReset(): void {
        this.isTimeTraveling = true;
        try {
            const resetState: Record<string, unknown> = {};
            for (const [storeName, storeRef] of this.stores) {
                const initialState = storeRef.getInitialState();
                storeRef.applyState(initialState);
                resetState[storeName] = initialState;
            }
            // Clear and rebuild baseState
            Object.keys(this.baseState).forEach(k => delete this.baseState[k]);
            Object.assign(this.baseState, resetState);
            this.localDevTool?.init(this.baseState);
            // Clear history
            this.historyEntries.length = 0;
            this.historyIdCounter = 0;
            this.currentPositionSig.set(-1);
        } finally {
            this.isTimeTraveling = false;
        }
    }
    
    /**
     * Handle ROLLBACK: revert to last committed state
     */
    private handleRollback(stateJson?: string): void {
        if (stateJson) {
            this.applyStateFromDevTools(stateJson);
        }
        this.localDevTool?.init(this.baseState);
        // Clear history since commit
        this.historyEntries.length = 0;
        this.historyIdCounter = 0;
        this.currentPositionSig.set(-1);
    }
    
    /**
     * Handle COMMIT: lock current state as new baseline
     */
    private handleCommit(): void {
        this.localDevTool?.init(this.baseState);
        // Clear history — committed state is the new baseline
        this.historyEntries.length = 0;
        this.historyIdCounter = 0;
        this.currentPositionSig.set(-1);
    }
    
    /**
     * Set callback for time-travel jumps.
     * @deprecated Use store registry (registerStore) instead. Stores auto-register.
     */
    setJumpCallback(callback: (storeName: string, state: unknown) => void): void {
        this.jumpCallback = callback;
    }
    
    /**
     * Jump to a specific action in history (programmatic API)
     */
    jumpToAction(actionId: number): void {
        const entry = this.historyEntries.find(e => e.id === actionId);
        if (!entry) {
            return;
        }
        this.currentPositionSig.set(actionId);
        // Try store registry first
        const storeRef = this.stores.get(entry.storeName);
        if (storeRef) {
            this.isTimeTraveling = true;
            try {
                storeRef.applyState(entry.state);
            } finally {
                this.isTimeTraveling = false;
            }
        }
        // Also notify via legacy callback
        this.jumpCallback?.(entry.storeName, entry.state);
    }
    
    /**
     * Import state from JSON string
     */
    private importState(stateJson: string): void {
        try {
            const imported = JSON.parse(stateJson);
            if (imported.computedStates) {
                const lastState = imported.computedStates[imported.computedStates.length - 1]?.state;
                if (lastState) {
                    this.isTimeTraveling = true;
                    try {
                        for (const storeName of Object.keys(lastState)) {
                            const storeRef = this.stores.get(storeName);
                            if (storeRef) {
                                storeRef.applyState(lastState[storeName]);
                            }
                            this.jumpCallback?.(storeName, lastState[storeName]);
                        }
                        Object.assign(this.baseState, lastState);
                    } finally {
                        this.isTimeTraveling = false;
                    }
                }
            }
        } catch (e) {
            console.error('NgSimpleState: Failed to import state:', e);
        }
    }
    
    /**
     * Return true if dev tool is active
     */
    isActive(): boolean {
        return !!this.localDevTool;
    }
    
    /**
     * Return true if currently applying state from DevTools (time-traveling)
     */
    get timeTraveling(): boolean {
        return this.isTimeTraveling;
    }
    
    /**
     * Return pause state signal
     */
    get isPaused(): Signal<boolean> {
        return this.isPausedSig.asReadonly();
    }
    
    /**
     * Return current position signal
     */
    get currentPosition(): Signal<number> {
        return this.currentPositionSig.asReadonly();
    }
    
    /**
     * Send state to dev tool with enhanced tracking
     */
    send<T>(storeName: string, actionName: string, state: T, prevState?: T): boolean {
        if (this.isPausedSig() || this.isTimeTraveling) {
            return false;
        }
        
        // Record in history
        const entry: StateHistoryEntry<T> = {
            id: ++this.historyIdCounter,
            storeName,
            actionName,
            state,
            prevState,
            timestamp: Date.now()
        };
        
        this.historyEntries.push(entry);
        
        // Trim history if needed
        if (this.historyEntries.length > this.maxHistorySize) {
            this.historyEntries.shift();
        }
        
        this.currentPositionSig.set(entry.id);
        
        if (this.localDevTool) {
            Object.assign(this.baseState, { [storeName]: state });
            this.localDevTool.send(
                `${storeName}.${actionName}`,
                this.baseState
            );
            return true;
        }
        
        return false;
    }
    
    /**
     * Get complete history
     */
    getHistory(): ReadonlyArray<StateHistoryEntry> {
        return [...this.historyEntries];
    }
    
    /**
     * Get history for a specific store
     */
    getStoreHistory(storeName: string): ReadonlyArray<StateHistoryEntry> {
        return this.historyEntries.filter(e => e.storeName === storeName);
    }
    
    /**
     * Clear history
     */
    clearHistory(): void {
        this.historyEntries.length = 0;
        this.historyIdCounter = 0;
        this.currentPositionSig.set(-1);
    }
    
    /**
     * Export current state as JSON
     */
    exportState(): string {
        return JSON.stringify({
            stores: this.baseState,
            history: this.historyEntries,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }
    
    /**
     * Compute diff between two states
     */
    static computeDiff(prevState: unknown, nextState: unknown, path: string = ''): StateDiff[] {
        const diffs: StateDiff[] = [];
        
        if (prevState === nextState) {
            return diffs;
        }
        
        const prevType = typeof prevState;
        const nextType = typeof nextState;
        
        if (prevType !== nextType || prevType !== 'object' || prevState === null || nextState === null) {
            if (prevState !== nextState) {
                diffs.push({
                    path: path || 'root',
                    type: prevState === undefined ? 'added' : nextState === undefined ? 'removed' : 'changed',
                    oldValue: prevState,
                    newValue: nextState
                });
            }
            return diffs;
        }
        
        const prevObj = prevState as Record<string, unknown>;
        const nextObj = nextState as Record<string, unknown>;
        const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);
        
        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;
            
            if (!(key in prevObj)) {
                diffs.push({
                    path: newPath,
                    type: 'added',
                    newValue: nextObj[key]
                });
            } else if (!(key in nextObj)) {
                diffs.push({
                    path: newPath,
                    type: 'removed',
                    oldValue: prevObj[key]
                });
            } else {
                diffs.push(...this.computeDiff(prevObj[key], nextObj[key], newPath));
            }
        }
        
        return diffs;
    }
    
    /**
     * Get diff for the last state change of a store
     */
    getLastDiff(storeName: string): StateDiff[] {
        const history = this.getStoreHistory(storeName);
        if (history.length < 1) {
            return [];
        }
        const last = history[history.length - 1];
        if (!last.prevState) {
            return [];
        }
        return NgSimpleStateDevTool.computeDiff(last.prevState, last.state);
    }
}
