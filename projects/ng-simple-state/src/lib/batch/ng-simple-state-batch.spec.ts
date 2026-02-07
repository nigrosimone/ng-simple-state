/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    NgSimpleStateBatchManager, 
    batchState,
    batchStateAsync,
    StateTransaction,
    withTransaction,
    createDebouncedUpdater,
    createThrottledUpdater
} from './ng-simple-state-batch';

describe('NgSimpleStateBatchManager', () => {
    
    let manager: NgSimpleStateBatchManager;
    
    beforeEach(() => {
        manager = NgSimpleStateBatchManager.getInstance();
    });

    afterEach(() => {
        // Reset state
        if (manager.isInBatch()) {
            manager.endBatch();
        }
        manager.clearPending();
    });

    it('should be a singleton', () => {
        const instance1 = NgSimpleStateBatchManager.getInstance();
        const instance2 = NgSimpleStateBatchManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should start batch mode', () => {
        expect(manager.isInBatch()).toBeFalse();
        manager.startBatch();
        expect(manager.isInBatch()).toBeTrue();
    });

    it('should end batch mode', () => {
        manager.startBatch();
        manager.endBatch();
        expect(manager.isInBatch()).toBeFalse();
    });

    it('should provide isBatching signal', () => {
        const signal = manager.isBatching;
        expect(signal()).toBeFalse();
        
        manager.startBatch();
        expect(signal()).toBeTrue();
        
        manager.endBatch();
        expect(signal()).toBeFalse();
    });

    it('should queue updates when batching', () => {
        let updateCalled = false;
        
        manager.startBatch();
        manager.queueUpdate('store1', () => {
            updateCalled = true;
        });
        
        // Update not called yet
        expect(updateCalled).toBeFalse();
        
        manager.endBatch();
        
        // Update called after endBatch
        expect(updateCalled).toBeTrue();
    });

    it('should execute only last update per store', () => {
        const results: number[] = [];
        
        manager.startBatch();
        manager.queueUpdate('store1', () => results.push(1));
        manager.queueUpdate('store1', () => results.push(2));
        manager.queueUpdate('store1', () => results.push(3));
        manager.endBatch();
        
        // Only the last update should be executed
        expect(results).toEqual([3]);
    });

    it('should handle multiple stores independently', () => {
        const store1Results: number[] = [];
        const store2Results: number[] = [];
        
        manager.startBatch();
        manager.queueUpdate('store1', () => store1Results.push(1));
        manager.queueUpdate('store1', () => store1Results.push(2));
        manager.queueUpdate('store2', () => store2Results.push(10));
        manager.queueUpdate('store2', () => store2Results.push(20));
        manager.endBatch();
        
        expect(store1Results).toEqual([2]);
        expect(store2Results).toEqual([20]);
    });

    it('should clear pending updates', () => {
        let updateCalled = false;
        
        manager.startBatch();
        manager.queueUpdate('store1', () => {
            updateCalled = true;
        });
        
        manager.clearPending();
        manager.endBatch();
        
        expect(updateCalled).toBeFalse();
    });
});


describe('batchState function', () => {
    
    it('should execute function and return result', () => {
        const result = batchState(() => {
            return 42;
        });
        
        expect(result).toBe(42);
    });

    it('should manage batch state correctly', () => {
        const manager = NgSimpleStateBatchManager.getInstance();
        
        let wasBatchingDuring = false;
        
        batchState(() => {
            wasBatchingDuring = manager.isInBatch();
        });
        
        expect(wasBatchingDuring).toBeTrue();
        expect(manager.isInBatch()).toBeFalse();
    });

    it('should end batch even if function throws', () => {
        const manager = NgSimpleStateBatchManager.getInstance();
        
        try {
            batchState(() => {
                throw new Error('Test error');
            });
        } catch {
            // Expected
        }
        
        expect(manager.isInBatch()).toBeFalse();
    });

    it('should support nested batch calls', () => {
        const manager = NgSimpleStateBatchManager.getInstance();
        
        batchState(() => {
            expect(manager.isInBatch()).toBeTrue();
            
            batchState(() => {
                expect(manager.isInBatch()).toBeTrue();
            });
            
            // Still in outer batch
            expect(manager.isInBatch()).toBeFalse(); // Outer batch ended by inner
        });
    });
});


describe('batchStateAsync function', () => {
    
    it('should execute async function and return result', async () => {
        const result = await batchStateAsync(async () => {
            return 42;
        });
        
        expect(result).toBe(42);
    });

    it('should manage batch state correctly for async', async () => {
        const manager = NgSimpleStateBatchManager.getInstance();
        
        let wasBatchingDuring = false;
        
        await batchStateAsync(async () => {
            wasBatchingDuring = manager.isInBatch();
        });
        
        expect(wasBatchingDuring).toBeTrue();
        expect(manager.isInBatch()).toBeFalse();
    });

    it('should end batch even if async function throws', async () => {
        const manager = NgSimpleStateBatchManager.getInstance();
        
        try {
            await batchStateAsync(async () => {
                throw new Error('Test error');
            });
        } catch {
            // Expected
        }
        
        expect(manager.isInBatch()).toBeFalse();
    });
});


describe('StateTransaction', () => {
    
    let state: { count: number };
    let tx: StateTransaction<{ count: number }>;

    beforeEach(() => {
        state = { count: 0 };
        tx = new StateTransaction(
            () => state,
            (newState) => { state = newState; }
        );
    });

    it('should be active initially', () => {
        expect(tx.isActive).toBeTrue();
    });

    it('should commit successfully', () => {
        state.count = 5;
        tx.commit();
        
        expect(tx.isActive).toBeFalse();
        expect(state.count).toBe(5);
    });

    it('should rollback to snapshot', () => {
        state.count = 5;
        tx.rollback();
        
        expect(tx.isActive).toBeFalse();
        expect(state.count).toBe(0);
    });

    it('should throw on double commit', () => {
        tx.commit();
        expect(() => tx.commit()).toThrowError('Transaction is not active');
    });

    it('should throw on double rollback', () => {
        tx.rollback();
        expect(() => tx.rollback()).toThrowError('Transaction is not active');
    });

    it('should throw on commit after rollback', () => {
        tx.rollback();
        expect(() => tx.commit()).toThrowError('Transaction is not active');
    });
});


describe('withTransaction', () => {
    
    it('should commit on success', async () => {
        const store = {
            state: { count: 0 },
            getCurrentState() { return this.state; },
            replaceState(state: { count: number }) { this.state = state; return true; }
        };
        
        await withTransaction(store, async () => {
            store.state.count = 5;
        });
        
        expect(store.state.count).toBe(5);
    });

    it('should rollback on error', async () => {
        const store = {
            state: { count: 0 },
            getCurrentState() { return this.state; },
            replaceState(state: { count: number }) { this.state = state; return true; }
        };
        
        try {
            await withTransaction(store, async () => {
                store.state.count = 5;
                throw new Error('Test error');
            });
        } catch {
            // Expected
        }
        
        expect(store.state.count).toBe(0);
    });

    it('should return result from function', async () => {
        const store = {
            state: { count: 0 },
            getCurrentState() { return this.state; },
            replaceState(state: { count: number }) { this.state = state; return true; }
        };
        
        const result = await withTransaction(store, async () => {
            return 42;
        });
        
        expect(result).toBe(42);
    });
});


describe('createDebouncedUpdater', () => {
    
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should debounce updates', () => {
        const updates: any[] = [];
        const { update } = createDebouncedUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        update({ count: 2 });
        update({ count: 3 });
        
        expect(updates.length).toBe(0);
        
        jasmine.clock().tick(100);
        
        expect(updates.length).toBe(1);
        expect(updates[0].count).toBe(3);
    });

    it('should merge pending states', () => {
        const updates: any[] = [];
        const { update } = createDebouncedUpdater<{ count: number; name: string }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 } as any);
        update({ name: 'test' } as any);
        
        jasmine.clock().tick(100);
        
        expect(updates[0]).toEqual({ count: 1, name: 'test' });
    });

    it('should flush immediately', () => {
        const updates: any[] = [];
        const { update, flush } = createDebouncedUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        flush();
        
        expect(updates.length).toBe(1);
    });

    it('should cancel pending updates', () => {
        const updates: any[] = [];
        const { update, cancel } = createDebouncedUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        cancel();
        
        jasmine.clock().tick(100);
        
        expect(updates.length).toBe(0);
    });
});


describe('createThrottledUpdater', () => {
    
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should execute first update immediately', () => {
        const updates: any[] = [];
        const { update } = createThrottledUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        
        expect(updates.length).toBe(1);
        expect(updates[0].count).toBe(1);
    });

    it('should throttle subsequent updates', () => {
        const updates: any[] = [];
        const { update } = createThrottledUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        update({ count: 2 });
        update({ count: 3 });
        
        expect(updates.length).toBe(1);
        
        jasmine.clock().tick(100);
        
        expect(updates.length).toBe(2);
        expect(updates[1].count).toBe(3);
    });

    it('should cancel pending throttled update', () => {
        const updates: any[] = [];
        const { update, cancel } = createThrottledUpdater<{ count: number }>(
            (state) => updates.push(state),
            100
        );
        
        update({ count: 1 });
        update({ count: 2 });
        cancel();
        
        jasmine.clock().tick(100);
        
        expect(updates.length).toBe(1);
    });
});
