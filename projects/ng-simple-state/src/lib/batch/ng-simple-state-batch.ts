import { signal, Signal, WritableSignal, untracked } from '@angular/core';

/**
 * Batch updates manager for grouping multiple state changes
 * into a single emission
 */
export class NgSimpleStateBatchManager {
    private static instance: NgSimpleStateBatchManager;
    private batching = false;
    private pendingUpdates: Map<string, Array<() => void>> = new Map();
    private readonly isBatchingSig: WritableSignal<boolean> = signal(false);
    
    private constructor() {}
    
    /**
     * Get singleton instance
     */
    static getInstance(): NgSimpleStateBatchManager {
        if (!NgSimpleStateBatchManager.instance) {
            NgSimpleStateBatchManager.instance = new NgSimpleStateBatchManager();
        }
        return NgSimpleStateBatchManager.instance;
    }
    
    /**
     * Check if currently batching
     */
    get isBatching(): Signal<boolean> {
        return this.isBatchingSig.asReadonly();
    }
    
    /**
     * Start a batch operation
     */
    startBatch(): void {
        this.batching = true;
        this.isBatchingSig.set(true);
    }
    
    /**
     * End batch operation and flush all pending updates
     */
    endBatch(): void {
        this.batching = false;
        this.isBatchingSig.set(false);
        this.flush();
    }
    
    /**
     * Check if currently in batch mode
     */
    isInBatch(): boolean {
        return this.batching;
    }
    
    /**
     * Queue an update for batching
     * @param storeId Unique store identifier
     * @param updateFn Update function to execute
     */
    queueUpdate(storeId: string, updateFn: () => void): void {
        if (!this.pendingUpdates.has(storeId)) {
            this.pendingUpdates.set(storeId, []);
        }
        this.pendingUpdates.get(storeId)!.push(updateFn);
    }
    
    /**
     * Flush all pending updates
     */
    private flush(): void {
        const updates = new Map(this.pendingUpdates);
        this.pendingUpdates.clear();
        
        updates.forEach((fns, storeId) => {
            // Execute only the last update for each store
            // since intermediate states are not needed
            const lastUpdate = fns[fns.length - 1];
            if (lastUpdate) {
                lastUpdate();
            }
        });
    }
    
    /**
     * Clear pending updates without executing
     */
    clearPending(): void {
        this.pendingUpdates.clear();
    }
}

/**
 * Execute multiple state updates in a batch
 * Only the final state is emitted
 * 
 * @example
 * ```ts
 * batchState(() => {
 *   store.setState({ count: 1 });
 *   store.setState({ count: 2 });
 *   store.setState({ count: 3 });
 * }); // Only emits once with count: 3
 * ```
 */
export function batchState<T>(updateFn: () => T): T {
    const manager = NgSimpleStateBatchManager.getInstance();
    manager.startBatch();
    try {
        return updateFn();
    } finally {
        manager.endBatch();
    }
}

/**
 * Execute multiple state updates in a batch asynchronously
 */
export async function batchStateAsync<T>(updateFn: () => Promise<T>): Promise<T> {
    const manager = NgSimpleStateBatchManager.getInstance();
    manager.startBatch();
    try {
        return await updateFn();
    } finally {
        manager.endBatch();
    }
}

/**
 * Transaction wrapper for atomic state updates
 * Rolls back on error
 */
export class StateTransaction<S> {
    private snapshot: S | null = null;
    private committed = false;
    private rolledBack = false;
    
    constructor(
        private readonly getCurrentState: () => S,
        private readonly replaceState: (state: S) => void
    ) {
        this.snapshot = structuredClone(this.getCurrentState());
    }
    
    /**
     * Check if transaction is still active
     */
    get isActive(): boolean {
        return !this.committed && !this.rolledBack;
    }
    
    /**
     * Commit the transaction
     */
    commit(): void {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }
        this.committed = true;
        this.snapshot = null;
    }
    
    /**
     * Rollback the transaction to the snapshot
     */
    rollback(): void {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }
        if (this.snapshot !== null) {
            this.replaceState(this.snapshot);
        }
        this.rolledBack = true;
        this.snapshot = null;
    }
}

/**
 * Execute operations in a transaction
 * Automatically rolls back on error
 * 
 * @example
 * ```ts
 * await withTransaction(store, async (tx) => {
 *   store.setState({ step: 1 });
 *   await apiCall(); // If this fails, state rolls back
 *   store.setState({ step: 2 });
 *   tx.commit();
 * });
 * ```
 */
export async function withTransaction<S, R>(
    store: { getCurrentState(): S; replaceState(state: S): boolean },
    fn: (transaction: StateTransaction<S>) => Promise<R>
): Promise<R> {
    const tx = new StateTransaction<S>(
        () => store.getCurrentState(),
        (state) => store.replaceState(state)
    );
    
    try {
        const result = await fn(tx);
        if (tx.isActive) {
            tx.commit();
        }
        return result;
    } catch (error) {
        if (tx.isActive) {
            tx.rollback();
        }
        throw error;
    }
}

/**
 * Debounce state updates
 * Only the last update within the time window is applied
 */
export function createDebouncedUpdater<S>(
    updateFn: (state: Partial<S>) => void,
    delay: number = 100
): {
    update: (state: Partial<S>) => void;
    flush: () => void;
    cancel: () => void;
} {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingState: Partial<S> = {};
    
    const flush = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (Object.keys(pendingState).length > 0) {
            updateFn(pendingState);
            pendingState = {};
        }
    };
    
    const cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        pendingState = {};
    };
    
    const update = (state: Partial<S>) => {
        pendingState = { ...pendingState, ...state };
        
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(flush, delay);
    };
    
    return { update, flush, cancel };
}

/**
 * Throttle state updates
 * At most one update per time window
 */
export function createThrottledUpdater<S>(
    updateFn: (state: Partial<S>) => void,
    delay: number = 100
): {
    update: (state: Partial<S>) => void;
    cancel: () => void;
} {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingState: Partial<S> | null = null;
    
    const cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        pendingState = null;
    };
    
    const update = (state: Partial<S>) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        
        if (timeSinceLastCall >= delay) {
            lastCall = now;
            updateFn(state);
        } else {
            pendingState = state;
            
            if (timeoutId === null) {
                timeoutId = setTimeout(() => {
                    timeoutId = null;
                    lastCall = Date.now();
                    if (pendingState !== null) {
                        updateFn(pendingState);
                        pendingState = null;
                    }
                }, delay - timeSinceLastCall);
            }
        }
    };
    
    return { update, cancel };
}
