/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal, Injector, runInInjectionContext } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { 
    StateTransaction, 
    withTransaction,
    createDebouncedUpdater,
    createThrottledUpdater
} from '../batch/ng-simple-state-batch';
import { NgSimpleStatePlugin } from '../plugin/ng-simple-state-plugin';

// --- Order Processing State ---

interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
}

interface CustomerInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

interface OrderState {
    orderId: string | null;
    items: OrderItem[];
    customer: CustomerInfo | null;
    shippingAddress: ShippingAddress | null;
    billingAddress: ShippingAddress | null;
    paymentMethod: 'card' | 'paypal' | 'bank' | null;
    status: 'draft' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    total: number;
    notes: string;
    createdAt: number | null;
    updatedAt: number | null;
}

@Injectable()
class OrderStore extends NgSimpleStateBaseSignalStore<OrderState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'OrderStore'
        };
    }

    initialState(): OrderState {
        return {
            orderId: null,
            items: [],
            customer: null,
            shippingAddress: null,
            billingAddress: null,
            paymentMethod: null,
            status: 'draft',
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            discount: 0,
            total: 0,
            notes: '',
            createdAt: null,
            updatedAt: null
        };
    }

    // Selectors
    selectItems(): Signal<OrderItem[]> {
        return this.selectState(state => state.items);
    }

    selectTotal(): Signal<number> {
        return this.selectState(state => state.total);
    }

    selectStatus(): Signal<OrderState['status']> {
        return this.selectState(state => state.status);
    }

    selectIsReadyToSubmit(): Signal<boolean> {
        return this.selectState(state => 
            state.items.length > 0 &&
            state.customer !== null &&
            state.shippingAddress !== null &&
            state.paymentMethod !== null
        );
    }

    // Actions
    addItem(item: OrderItem): boolean {
        return this.setState(state => {
            const newItems = [...state.items, item];
            return {
                items: newItems,
                ...this.calculateTotals(newItems, state.discount, state.shippingCost),
                updatedAt: Date.now()
            };
        });
    }

    removeItem(productId: string): boolean {
        return this.setState(state => {
            const newItems = state.items.filter(i => i.productId !== productId);
            return {
                items: newItems,
                ...this.calculateTotals(newItems, state.discount, state.shippingCost),
                updatedAt: Date.now()
            };
        });
    }

    updateItemQuantity(productId: string, quantity: number): boolean {
        return this.setState(state => {
            const newItems = state.items.map(i =>
                i.productId === productId ? { ...i, quantity } : i
            );
            return {
                items: newItems,
                ...this.calculateTotals(newItems, state.discount, state.shippingCost),
                updatedAt: Date.now()
            };
        });
    }

    setCustomer(customer: CustomerInfo): boolean {
        return this.setState({ customer, updatedAt: Date.now() });
    }

    setShippingAddress(address: ShippingAddress): boolean {
        return this.setState({ shippingAddress: address, updatedAt: Date.now() });
    }

    setBillingAddress(address: ShippingAddress): boolean {
        return this.setState({ billingAddress: address, updatedAt: Date.now() });
    }

    useShippingAsBilling(): boolean {
        return this.setState(state => ({
            billingAddress: state.shippingAddress,
            updatedAt: Date.now()
        }));
    }

    setPaymentMethod(method: OrderState['paymentMethod']): boolean {
        return this.setState({ paymentMethod: method, updatedAt: Date.now() });
    }

    applyDiscount(discount: number): boolean {
        return this.setState(state => ({
            discount,
            ...this.calculateTotals(state.items, discount, state.shippingCost),
            updatedAt: Date.now()
        }));
    }

    setShippingCost(cost: number): boolean {
        return this.setState(state => ({
            shippingCost: cost,
            ...this.calculateTotals(state.items, state.discount, cost),
            updatedAt: Date.now()
        }));
    }

    setStatus(status: OrderState['status']): boolean {
        return this.setState({ status, updatedAt: Date.now() });
    }

    setNotes(notes: string): boolean {
        return this.setState({ notes, updatedAt: Date.now() });
    }

    submitOrder(): boolean {
        return this.setState(state => ({
            orderId: state.orderId ?? `ORD-${Date.now()}`,
            status: 'pending',
            createdAt: state.createdAt ?? Date.now(),
            updatedAt: Date.now()
        }));
    }

    cancelOrder(): boolean {
        return this.setState({ status: 'cancelled', updatedAt: Date.now() });
    }

    private calculateTotals(items: OrderItem[], discount: number, shippingCost: number) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxableAmount = subtotal - discount;
        const tax = Math.max(0, taxableAmount * 0.08); // 8% tax
        const total = Math.max(0, subtotal - discount + tax + shippingCost);
        
        return { subtotal, tax, total };
    }
}

// --- Integration Tests ---

describe('Batch Operations Integration Tests', () => {

    let orderStore: OrderStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                OrderStore
            ]
        });
        orderStore = TestBed.inject(OrderStore);
    });

    describe('Standard Operations', () => {

        it('should create an order with items', () => {
            orderStore.addItem({
                productId: 'prod1',
                name: 'Widget',
                quantity: 2,
                unitPrice: 29.99
            });

            expect(orderStore.selectItems()().length).toBe(1);
            expect(orderStore.selectTotal()()).toBeGreaterThan(0);
        });

        it('should calculate totals correctly', () => {
            orderStore.addItem({
                productId: 'prod1',
                name: 'Widget',
                quantity: 2,
                unitPrice: 100 // $200 subtotal
            });
            orderStore.applyDiscount(20); // $180 taxable
            orderStore.setShippingCost(10);
            
            const state = orderStore.getCurrentState();
            expect(state.subtotal).toBe(200);
            expect(state.discount).toBe(20);
            expect(state.tax).toBeCloseTo(14.4, 2); // 8% of 180
            expect(state.total).toBeCloseTo(204.4, 2); // 200 - 20 + 14.4 + 10
        });
    });

    describe('Transaction Operations', () => {

        it('should commit successful transaction', async () => {
            await withTransaction(orderStore, async (tx) => {
                orderStore.addItem({ productId: 'p1', name: 'Transaction Item', quantity: 1, unitPrice: 100 });
                orderStore.setPaymentMethod('card');
                tx.commit();
            });

            expect(orderStore.selectItems()().length).toBe(1);
            expect(orderStore.getCurrentState().paymentMethod).toBe('card');
        });

        it('should rollback failed transaction', async () => {
            // Add initial item
            orderStore.addItem({ productId: 'initial', name: 'Initial', quantity: 1, unitPrice: 50 });
            
            try {
                await withTransaction(orderStore, async () => {
                    orderStore.addItem({ productId: 'p1', name: 'New Item', quantity: 1, unitPrice: 100 });
                    orderStore.setPaymentMethod('paypal');
                    throw new Error('Payment failed');
                });
            } catch {
                // Expected
            }

            // Should rollback to state with only initial item
            expect(orderStore.selectItems()().length).toBe(1);
            expect(orderStore.selectItems()()[0].productId).toBe('initial');
            expect(orderStore.getCurrentState().paymentMethod).toBeNull();
        });

        it('should auto-commit if not explicitly committed', async () => {
            await withTransaction(orderStore, async () => {
                orderStore.addItem({ productId: 'auto', name: 'Auto Commit', quantity: 1, unitPrice: 75 });
            });

            expect(orderStore.selectItems()().length).toBe(1);
        });

        it('should maintain transaction isolation', async () => {
            const results: string[] = [];

            await withTransaction(orderStore, async (tx) => {
                results.push(`active: ${tx.isActive}`);
                orderStore.addItem({ productId: 'p1', name: 'Item', quantity: 1, unitPrice: 100 });
                results.push(`items after add: ${orderStore.selectItems()().length}`);
                tx.commit();
                results.push(`active after commit: ${tx.isActive}`);
            });

            expect(results).toEqual([
                'active: true',
                'items after add: 1',
                'active after commit: false'
            ]);
        });
    });

    describe('StateTransaction Class', () => {

        it('should create transaction with snapshot', () => {
            let capturedState: OrderState | null = null;
            
            const tx = new StateTransaction<OrderState>(
                () => orderStore.getCurrentState(),
                (state) => { capturedState = state; orderStore.replaceState(state); }
            );

            expect(tx.isActive).toBeTrue();
        });

        it('should throw on double commit', () => {
            const tx = new StateTransaction<OrderState>(
                () => orderStore.getCurrentState(),
                () => {}
            );

            tx.commit();
            expect(() => tx.commit()).toThrowError('Transaction is not active');
        });

        it('should throw on double rollback', () => {
            const tx = new StateTransaction<OrderState>(
                () => orderStore.getCurrentState(),
                (state) => orderStore.replaceState(state)
            );

            tx.rollback();
            expect(() => tx.rollback()).toThrowError('Transaction is not active');
        });

        it('should throw on commit after rollback', () => {
            const tx = new StateTransaction<OrderState>(
                () => orderStore.getCurrentState(),
                (state) => orderStore.replaceState(state)
            );

            tx.rollback();
            expect(() => tx.commit()).toThrowError('Transaction is not active');
        });
    });

    describe('Debounced Updates', () => {

        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('should debounce rapid updates', () => {
            const updates: Partial<OrderState>[] = [];
            
            const { update } = createDebouncedUpdater<OrderState>(
                (state) => updates.push(state),
                200
            );

            update({ notes: 'First' });
            update({ notes: 'Second' });
            update({ notes: 'Third' });

            expect(updates.length).toBe(0);

            jasmine.clock().tick(200);

            expect(updates.length).toBe(1);
            expect(updates[0].notes).toBe('Third');
        });

        it('should merge debounced updates', () => {
            const updates: any[] = [];
            
            const { update } = createDebouncedUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'Note' } as Partial<OrderState>);
            update({ discount: 10 } as Partial<OrderState>);
            update({ shippingCost: 5 } as Partial<OrderState>);

            jasmine.clock().tick(100);

            expect(updates.length).toBe(1);
            expect(updates[0]).toEqual({ notes: 'Note', discount: 10, shippingCost: 5 });
        });

        it('should flush debounced updates immediately', () => {
            const updates: any[] = [];
            
            const { update, flush } = createDebouncedUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'Immediate' } as Partial<OrderState>);
            flush();

            expect(updates.length).toBe(1);
        });

        it('should cancel debounced updates', () => {
            const updates: any[] = [];
            
            const { update, cancel } = createDebouncedUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'Cancelled' } as Partial<OrderState>);
            cancel();

            jasmine.clock().tick(100);

            expect(updates.length).toBe(0);
        });
    });

    describe('Throttled Updates', () => {

        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('should execute first update immediately', () => {
            const updates: any[] = [];
            
            const { update } = createThrottledUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'First' } as Partial<OrderState>);

            expect(updates.length).toBe(1);
            expect(updates[0].notes).toBe('First');
        });

        it('should throttle subsequent updates', () => {
            const updates: any[] = [];
            
            const { update } = createThrottledUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'First' } as Partial<OrderState>);
            update({ notes: 'Second' } as Partial<OrderState>);
            update({ notes: 'Third' } as Partial<OrderState>);

            expect(updates.length).toBe(1);

            jasmine.clock().tick(100);

            expect(updates.length).toBe(2);
            expect(updates[1].notes).toBe('Third');
        });

        it('should cancel throttled pending updates', () => {
            const updates: any[] = [];
            
            const { update, cancel } = createThrottledUpdater<OrderState>(
                (state) => updates.push(state),
                100
            );

            update({ notes: 'First' } as Partial<OrderState>);
            update({ notes: 'Pending' } as Partial<OrderState>);
            cancel();

            jasmine.clock().tick(100);

            expect(updates.length).toBe(1);
        });
    });

    describe('Complete Order Flow', () => {

        it('should handle complete checkout process', async () => {
            // Step 1: Add items
            orderStore.addItem({
                productId: 'laptop',
                name: 'Laptop Pro',
                quantity: 1,
                unitPrice: 1299.99
            });
            orderStore.addItem({
                productId: 'mouse',
                name: 'Wireless Mouse',
                quantity: 2,
                unitPrice: 49.99
            });
            orderStore.addItem({
                productId: 'keyboard',
                name: 'Mechanical Keyboard',
                quantity: 1,
                unitPrice: 149.99
            });

            // Step 2: Set customer info
            orderStore.setCustomer({
                id: 'cust-001',
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '555-1234'
            });

            // Step 3: Set addresses
            const address: ShippingAddress = {
                street: '456 Oak Avenue',
                city: 'Tech City',
                state: 'CA',
                zip: '94102',
                country: 'USA'
            };
            orderStore.setShippingAddress(address);
            orderStore.useShippingAsBilling();

            // Step 4: Apply discount and shipping
            orderStore.applyDiscount(100); // $100 off
            orderStore.setShippingCost(9.99);

            // Step 5: Set payment
            orderStore.setPaymentMethod('card');

            // Verify ready to submit
            expect(orderStore.selectIsReadyToSubmit()()).toBeTrue();

            // Step 6: Submit with transaction
            await withTransaction(orderStore, async () => {
                orderStore.submitOrder();
            });

            const finalState = orderStore.getCurrentState();
            expect(finalState.status).toBe('pending');
            expect(finalState.orderId).toContain('ORD-');
            expect(finalState.items.length).toBe(3);
            expect(finalState.billingAddress).toEqual(finalState.shippingAddress);
        });

        it('should handle order cancellation with rollback', async () => {
            // Setup order
            orderStore.addItem({
                productId: 'p1',
                name: 'Product',
                quantity: 1,
                unitPrice: 100
            });
            orderStore.setCustomer({
                id: 'c1',
                name: 'Customer',
                email: 'c@test.com',
                phone: '555-0000'
            });
            orderStore.setShippingAddress({
                street: '1 Main',
                city: 'City',
                state: 'ST',
                zip: '00000',
                country: 'US'
            });
            orderStore.setPaymentMethod('paypal');
            orderStore.submitOrder();

            const orderId = orderStore.getCurrentState().orderId;

            // Process order
            orderStore.setStatus('processing');

            // Cancel order
            orderStore.cancelOrder();

            expect(orderStore.selectStatus()()).toBe('cancelled');
            expect(orderStore.getCurrentState().orderId).toBe(orderId);
        });
    });
});

describe('Plugin Integration with Transaction', () => {

    it('should allow plugin to block during transaction', async () => {
        let blockNext = false;
        
        const blockingPlugin: NgSimpleStatePlugin<OrderState> = {
            name: 'conditionalBlocker',
            onBeforeStateChange(context) {
                if (blockNext && context.actionName === 'setPaymentMethod') {
                    return false;
                }
                return true;
            }
        };

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false, plugins: [blockingPlugin] }),
                OrderStore
            ]
        });
        
        const store = TestBed.inject(OrderStore);

        store.addItem({ productId: 'p1', name: 'Item', quantity: 1, unitPrice: 100 });
        
        blockNext = true;
        
        // Payment method change should be blocked
        expect(store.setPaymentMethod('card')).toBeFalse();
        expect(store.getCurrentState().paymentMethod).toBeNull();
        
        blockNext = false;
        
        // Now it should work
        expect(store.setPaymentMethod('card')).toBeTrue();
        expect(store.getCurrentState().paymentMethod).toBe('card');
    });
});
