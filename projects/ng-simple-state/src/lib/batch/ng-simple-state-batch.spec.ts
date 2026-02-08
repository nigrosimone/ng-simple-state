/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    StateTransaction,
    withTransaction,
    createDebouncedUpdater,
    createThrottledUpdater
} from './ng-simple-state-batch';


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
