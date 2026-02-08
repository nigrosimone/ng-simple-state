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
