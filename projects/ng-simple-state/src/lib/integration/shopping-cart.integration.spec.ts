/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { undoRedoPlugin, NgSimpleStateUndoRedoPlugin } from '../plugin/ng-simple-state-plugin';
import { withTransaction } from '../batch/ng-simple-state-batch';

// --- Shopping Cart State Models ---

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface ShoppingCartState {
    items: CartItem[];
    discount: number;
    couponCode: string | null;
    loading: boolean;
}

interface ProductCatalogState {
    products: Product[];
    selectedCategory: string | null;
    searchQuery: string;
}

// --- Shopping Cart Store ---

@Injectable()
class ShoppingCartStore extends NgSimpleStateBaseSignalStore<ShoppingCartState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'ShoppingCart'
        };
    }

    initialState(): ShoppingCartState {
        return {
            items: [],
            discount: 0,
            couponCode: null,
            loading: false
        };
    }

    // Selectors
    selectItems(): Signal<CartItem[]> {
        return this.selectState(state => state.items);
    }

    selectTotalItems(): Signal<number> {
        return this.selectState(state => 
            state.items.reduce((sum, item) => sum + item.quantity, 0)
        );
    }

    selectSubtotal(): Signal<number> {
        return this.selectState(state => 
            state.items.reduce((sum, item) => 
                sum + (item.product.price * item.quantity), 0
            )
        );
    }

    selectTotal(): Signal<number> {
        return this.selectState(state => {
            const subtotal = state.items.reduce((sum, item) => 
                sum + (item.product.price * item.quantity), 0
            );
            return subtotal * (1 - state.discount / 100);
        });
    }

    selectIsEmpty(): Signal<boolean> {
        return this.selectState(state => state.items.length === 0);
    }

    // Actions
    addItem(product: Product, quantity: number = 1): boolean {
        return this.setState(state => {
            const existingIndex = state.items.findIndex(
                item => item.product.id === product.id
            );
            
            if (existingIndex >= 0) {
                const newItems = [...state.items];
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + quantity
                };
                return { items: newItems };
            }
            
            return {
                items: [...state.items, { product, quantity }]
            };
        });
    }

    removeItem(productId: string): boolean {
        return this.setState(state => ({
            items: state.items.filter(item => item.product.id !== productId)
        }));
    }

    updateQuantity(productId: string, quantity: number): boolean {
        if (quantity <= 0) {
            return this.removeItem(productId);
        }
        return this.setState(state => ({
            items: state.items.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        }));
    }

    applyCoupon(code: string, discountPercent: number): boolean {
        return this.setState({
            couponCode: code,
            discount: discountPercent
        });
    }

    removeCoupon(): boolean {
        return this.setState({
            couponCode: null,
            discount: 0
        });
    }

    clearCart(): boolean {
        return this.setState({ items: [], discount: 0, couponCode: null });
    }

    setLoading(loading: boolean): boolean {
        return this.setState({ loading });
    }
}

// --- Product Catalog Store ---

@Injectable()
class ProductCatalogStore extends NgSimpleStateBaseSignalStore<ProductCatalogState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'ProductCatalog'
        };
    }

    initialState(): ProductCatalogState {
        return {
            products: [
                { id: '1', name: 'Laptop', price: 999.99, stock: 10 },
                { id: '2', name: 'Keyboard', price: 79.99, stock: 50 },
                { id: '3', name: 'Mouse', price: 29.99, stock: 100 },
                { id: '4', name: 'Monitor', price: 299.99, stock: 20 },
                { id: '5', name: 'Headphones', price: 149.99, stock: 30 }
            ],
            selectedCategory: null,
            searchQuery: ''
        };
    }

    selectProducts(): Signal<Product[]> {
        return this.selectState(state => state.products);
    }

    selectProductById(id: string): Signal<Product | undefined> {
        return this.selectState(state => 
            state.products.find(p => p.id === id)
        );
    }

    updateStock(productId: string, quantityChange: number): boolean {
        return this.setState(state => ({
            products: state.products.map(p =>
                p.id === productId
                    ? { ...p, stock: Math.max(0, p.stock + quantityChange) }
                    : p
            )
        }));
    }

    setSearchQuery(query: string): boolean {
        return this.setState({ searchQuery: query });
    }
}

// --- Integration Tests ---

describe('Shopping Cart Integration Tests', () => {

    let cartStore: ShoppingCartStore;
    let catalogStore: ProductCatalogStore;
    let undoRedoPlugin_: NgSimpleStateUndoRedoPlugin<ShoppingCartState>;

    beforeEach(() => {
        undoRedoPlugin_ = undoRedoPlugin<ShoppingCartState>({ maxHistory: 20 });

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({
                    enableDevTool: false,
                    plugins: [undoRedoPlugin_]
                }),
                ShoppingCartStore,
                ProductCatalogStore
            ]
        });

        cartStore = TestBed.inject(ShoppingCartStore);
        catalogStore = TestBed.inject(ProductCatalogStore);
    });

    describe('Basic Cart Operations', () => {

        it('should start with an empty cart', () => {
            expect(cartStore.selectIsEmpty()()).toBeTrue();
            expect(cartStore.selectTotalItems()()).toBe(0);
            expect(cartStore.selectTotal()()).toBe(0);
        });

        it('should add a product to cart', () => {
            const product = catalogStore.selectProducts()()[0]; // Laptop
            
            expect(cartStore.addItem(product, 1)).toBeTrue();
            
            expect(cartStore.selectIsEmpty()()).toBeFalse();
            expect(cartStore.selectTotalItems()()).toBe(1);
            expect(cartStore.selectSubtotal()()).toBe(999.99);
        });

        it('should increase quantity when adding same product twice', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 1);
            cartStore.addItem(product, 2);
            
            expect(cartStore.selectTotalItems()()).toBe(3);
            expect(cartStore.selectItems()()[0].quantity).toBe(3);
        });

        it('should add multiple different products', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1); // Laptop $999.99
            cartStore.addItem(products[1], 2); // Keyboard $79.99 x 2
            cartStore.addItem(products[2], 3); // Mouse $29.99 x 3
            
            expect(cartStore.selectItems()().length).toBe(3);
            expect(cartStore.selectTotalItems()()).toBe(6);
            expect(cartStore.selectSubtotal()()).toBeCloseTo(999.99 + 159.98 + 89.97, 2);
        });

        it('should remove a product from cart', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1);
            cartStore.addItem(products[1], 1);
            
            expect(cartStore.selectItems()().length).toBe(2);
            
            cartStore.removeItem(products[0].id);
            
            expect(cartStore.selectItems()().length).toBe(1);
            expect(cartStore.selectItems()()[0].product.id).toBe(products[1].id);
        });

        it('should update product quantity', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 1);
            cartStore.updateQuantity(product.id, 5);
            
            expect(cartStore.selectTotalItems()()).toBe(5);
        });

        it('should remove item when quantity set to 0', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 3);
            cartStore.updateQuantity(product.id, 0);
            
            expect(cartStore.selectIsEmpty()()).toBeTrue();
        });

        it('should clear entire cart', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1);
            cartStore.addItem(products[1], 2);
            cartStore.applyCoupon('SAVE10', 10);
            
            cartStore.clearCart();
            
            expect(cartStore.selectIsEmpty()()).toBeTrue();
            expect(cartStore.getCurrentState().couponCode).toBeNull();
            expect(cartStore.getCurrentState().discount).toBe(0);
        });
    });

    describe('Coupon and Discount Operations', () => {

        it('should apply a coupon discount', () => {
            const product = catalogStore.selectProducts()()[0]; // $999.99
            
            cartStore.addItem(product, 1);
            cartStore.applyCoupon('SAVE20', 20);
            
            expect(cartStore.getCurrentState().couponCode).toBe('SAVE20');
            expect(cartStore.getCurrentState().discount).toBe(20);
            expect(cartStore.selectTotal()()).toBeCloseTo(799.99, 2);
        });

        it('should remove coupon', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 1);
            cartStore.applyCoupon('SAVE20', 20);
            cartStore.removeCoupon();
            
            expect(cartStore.getCurrentState().couponCode).toBeNull();
            expect(cartStore.selectTotal()()).toBe(999.99);
        });

        it('should calculate total with discount correctly', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1); // $999.99
            cartStore.addItem(products[1], 1); // $79.99
            // Total: $1079.98
            
            cartStore.applyCoupon('HALF', 50);
            
            expect(cartStore.selectTotal()()).toBeCloseTo(539.99, 2);
        });
    });

    describe('Undo/Redo with Cart Operations', () => {

        it('should undo add item operation', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 1);
            
            expect(cartStore.selectIsEmpty()()).toBeFalse();
            expect(undoRedoPlugin_.canUndo('ShoppingCart')).toBeTrue();
            
            const prevState = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(prevState!);
            
            expect(cartStore.selectIsEmpty()()).toBeTrue();
        });

        it('should redo add item operation', () => {
            const product = catalogStore.selectProducts()()[0];
            
            cartStore.addItem(product, 1);
            
            const prevState = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(prevState!);
            
            expect(cartStore.selectIsEmpty()()).toBeTrue();
            expect(undoRedoPlugin_.canRedo('ShoppingCart')).toBeTrue();
            
            const nextState = undoRedoPlugin_.redo('ShoppingCart');
            cartStore.replaceState(nextState!);
            
            expect(cartStore.selectIsEmpty()()).toBeFalse();
        });

        it('should track multiple operations for undo', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1);
            cartStore.addItem(products[1], 1);
            cartStore.addItem(products[2], 1);
            
            expect(cartStore.selectItems()().length).toBe(3);
            
            // Undo 3 times
            let state = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(state!);
            expect(cartStore.selectItems()().length).toBe(2);
            
            state = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(state!);
            expect(cartStore.selectItems()().length).toBe(1);
            
            state = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(state!);
            expect(cartStore.selectItems()().length).toBe(0);
        });

        it('should clear redo stack on new action', () => {
            const products = catalogStore.selectProducts()();
            
            cartStore.addItem(products[0], 1);
            
            const prevState = undoRedoPlugin_.undo('ShoppingCart');
            cartStore.replaceState(prevState!);
            
            expect(undoRedoPlugin_.canRedo('ShoppingCart')).toBeTrue();
            
            // New action
            cartStore.addItem(products[1], 1);
            
            expect(undoRedoPlugin_.canRedo('ShoppingCart')).toBeFalse();
        });
    });

    describe('Transaction with Cart Operations', () => {

        it('should commit successful transaction', async () => {
            const product = catalogStore.selectProducts()()[0];
            
            await withTransaction(cartStore, async () => {
                cartStore.addItem(product, 1);
                cartStore.applyCoupon('SUCCESS', 15);
            });
            
            expect(cartStore.selectItems()().length).toBe(1);
            expect(cartStore.getCurrentState().couponCode).toBe('SUCCESS');
        });

        it('should rollback failed transaction', async () => {
            const product = catalogStore.selectProducts()()[0];
            
            // Pre-add an item
            cartStore.addItem(product, 1);
            
            try {
                await withTransaction(cartStore, async () => {
                    cartStore.updateQuantity(product.id, 5);
                    cartStore.applyCoupon('FAIL', 50);
                    throw new Error('Simulated checkout error');
                });
            } catch {
                // Expected
            }
            
            // State should be rolled back
            expect(cartStore.selectTotalItems()()).toBe(1); // Original quantity
            expect(cartStore.getCurrentState().couponCode).toBeNull(); // No coupon
        });
    });

    describe('Multi-Store Communication', () => {

        it('should update product stock when adding to cart', () => {
            const productId = '1';
            const product = catalogStore.selectProductById(productId)();
            const initialStock = product!.stock;
            
            // Add to cart and update stock
            cartStore.addItem(product!, 2);
            catalogStore.updateStock(productId, -2);
            
            const updatedProduct = catalogStore.selectProductById(productId)();
            expect(updatedProduct!.stock).toBe(initialStock - 2);
        });

        it('should handle buying entire product stock', () => {
            const productId = '3'; // Mouse with 100 stock
            const product = catalogStore.selectProductById(productId)();
            
            // Buy entire stock
            cartStore.addItem(product!, 100);
            catalogStore.updateStock(productId, -100);
            
            const updatedProduct = catalogStore.selectProductById(productId)();
            expect(updatedProduct!.stock).toBe(0);
            expect(cartStore.selectTotalItems()()).toBe(100);
        });

        it('should restore stock on cart item removal', () => {
            const productId = '2';
            const product = catalogStore.selectProductById(productId)();
            const initialStock = product!.stock;
            
            // Buy and reduce stock
            cartStore.addItem(product!, 5);
            catalogStore.updateStock(productId, -5);
            
            // Remove from cart and restore stock
            cartStore.removeItem(productId);
            catalogStore.updateStock(productId, +5);
            
            const updatedProduct = catalogStore.selectProductById(productId)();
            expect(updatedProduct!.stock).toBe(initialStock);
            expect(cartStore.selectIsEmpty()()).toBeTrue();
        });
    });

    describe('Complex Shopping Scenarios', () => {

        it('should handle a complete checkout flow', () => {
            const products = catalogStore.selectProducts()();
            
            // Customer browses and adds items
            cartStore.addItem(products[0], 1); // Laptop
            cartStore.addItem(products[3], 2); // 2 Monitors
            
            // Update quantities
            cartStore.updateQuantity(products[3].id, 1); // Change to 1 Monitor
            
            // Apply coupon
            cartStore.applyCoupon('NEWYEAR', 15);
            
            // Verify final cart
            expect(cartStore.selectItems()().length).toBe(2);
            expect(cartStore.selectTotalItems()()).toBe(2);
            
            const subtotal = 999.99 + 299.99; // $1299.98
            expect(cartStore.selectSubtotal()()).toBeCloseTo(subtotal, 2);
            expect(cartStore.selectTotal()()).toBeCloseTo(subtotal * 0.85, 2);
        });

        it('should handle empty cart edge cases', () => {
            // Remove from empty cart should not fail
            expect(cartStore.removeItem('non-existent')).toBeTrue();
            
            // Update quantity in empty cart
            expect(cartStore.updateQuantity('non-existent', 5)).toBeTrue();
            
            // Cart is still empty
            expect(cartStore.selectIsEmpty()()).toBeTrue();
        });

        it('should maintain reactivity through operations', () => {
            const isEmpty = cartStore.selectIsEmpty();
            const total = cartStore.selectTotal();
            const itemCount = cartStore.selectTotalItems();
            
            // Initial state
            expect(isEmpty()).toBeTrue();
            expect(total()).toBe(0);
            expect(itemCount()).toBe(0);
            
            // Add item
            const product = catalogStore.selectProducts()()[0];
            cartStore.addItem(product, 1);
            
            expect(isEmpty()).toBeFalse();
            expect(total()).toBe(999.99);
            expect(itemCount()).toBe(1);
            
            // Apply discount
            cartStore.applyCoupon('SIGNAL', 10);
            
            expect(total()).toBeCloseTo(899.99, 2);
            
            // Clear cart
            cartStore.clearCart();
            
            expect(isEmpty()).toBeTrue();
            expect(total()).toBe(0);
        });
    });
});
