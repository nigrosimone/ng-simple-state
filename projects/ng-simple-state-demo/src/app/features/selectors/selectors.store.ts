import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface SelectorsState {
  products: Product[];
  taxRate: number;
  discount: number;
  computationCount: number;
}

@Injectable()
export class SelectorsStore extends NgSimpleStateBaseSignalStore<SelectorsState> {
  
  // Track computation count for demo purposes
  private _computeCount = 0;

  storeConfig(): NgSimpleStateStoreConfig<SelectorsState> {
    return {
      storeName: 'SelectorsStore'
    };
  }

  initialState(): SelectorsState {
    return {
      products: [
        { id: 1, name: 'Laptop', price: 999, quantity: 1 },
        { id: 2, name: 'Mouse', price: 29, quantity: 2 },
        { id: 3, name: 'Keyboard', price: 79, quantity: 1 }
      ],
      taxRate: 0.22,
      discount: 0,
      computationCount: 0
    };
  }

  // Standard selector (computed every time)
  selectProducts(): Signal<Product[]> {
    return this.selectState(state => state.products);
  }

  selectTaxRate(): Signal<number> {
    return this.selectState(state => state.taxRate);
  }

  selectDiscount(): Signal<number> {
    return this.selectState(state => state.discount);
  }

  selectComputationCount(): Signal<number> {
    return this.selectState(state => state.computationCount);
  }

  // Memoized selector - result is cached
  selectSubtotalMemoized(): Signal<number> {
    return this.selectStateMemoized(state => {
      this._computeCount++;
      this.setState({ computationCount: this._computeCount }, 'updateComputeCount');
      console.log('[SelectorsStore] Computing subtotal...');
      return state.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    });
  }

  // Memoized selector with key - ensures single instance
  selectTotalWithTaxMemoized(): Signal<number> {
    return this.selectStateMemoized(state => {
      console.log('[SelectorsStore] Computing total with tax...');
      const subtotal = state.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const afterDiscount = subtotal - state.discount;
      return afterDiscount * (1 + state.taxRate);
    });
  }

  // Non-memoized expensive selector for comparison
  selectTotalExpensive(): Signal<number> {
    return this.selectState(state => {
      console.log('[SelectorsStore] Computing total (non-memoized)...');
      // Simulate expensive computation
      const subtotal = state.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const afterDiscount = subtotal - state.discount;
      return afterDiscount * (1 + state.taxRate);
    });
  }

  // Product count
  selectProductCount(): Signal<number> {
    return this.selectStateMemoized(state => state.products.length);
  }

  // Actions
  addProduct(name: string, price: number): void {
    this.setState(state => ({
      products: [...state.products, { id: Date.now(), name, price, quantity: 1 }]
    }));
  }

  removeProduct(id: number): void {
    this.setState(state => ({
      products: state.products.filter(p => p.id !== id)
    }));
  }

  updateQuantity(id: number, quantity: number): void {
    this.setState(state => ({
      products: state.products.map(p => p.id === id ? { ...p, quantity } : p)
    }));
  }

  setTaxRate(rate: number): void {
    this.setState({ taxRate: rate });
  }

  setDiscount(discount: number): void {
    this.setState({ discount });
  }

  resetComputationCount(): void {
    this._computeCount = 0;
    this.setState({ computationCount: 0 });
  }
}
