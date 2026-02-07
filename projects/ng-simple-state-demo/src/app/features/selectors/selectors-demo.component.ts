import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, SelectorsStore } from './selectors.store';

@Component({
  selector: 'app-selectors-demo',
  template: `
    <h3>Memoized Selectors Demo</h3>
    <p>Cache expensive computations for better performance.</p>
    
    <div class="demo-section">
      <h4>Shopping Cart</h4>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (product of products(); track product.id) {
            <tr>
              <td>{{ product.name }}</td>
              <td>{{ product.price | currency }}</td>
              <td>
                <input 
                  type="number" 
                  [ngModel]="product.quantity" 
                  (ngModelChange)="store.updateQuantity(product.id, $event)"
                  min="1"
                  style="width: 60px"
                />
              </td>
              <td>{{ product.price * product.quantity | currency }}</td>
              <td>
                <button class="small" (click)="store.removeProduct(product.id)">Remove</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      
      <div class="add-product">
        <input #productName type="text" placeholder="Product name" />
        <input #productPrice type="number" placeholder="Price" style="width: 80px" />
        <button (click)="store.addProduct(productName.value, +productPrice.value); productName.value = ''; productPrice.value = ''">
          Add Product
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h4>Cart Summary (Memoized)</h4>
      
      <div class="summary-grid">
        <div class="summary-item">
          <span>Subtotal (memoized):</span>
          <strong>{{ subtotal() | currency }}</strong>
        </div>
        
        <div class="summary-item">
          <span>Discount:</span>
          <input 
            type="number" 
            [ngModel]="discount()" 
            (ngModelChange)="store.setDiscount($event)"
            style="width: 80px"
          />
        </div>
        
        <div class="summary-item">
          <span>Tax Rate:</span>
          <select [ngModel]="taxRate()" (ngModelChange)="store.setTaxRate($event)">
            <option [ngValue]="0.10">10%</option>
            <option [ngValue]="0.22">22%</option>
            <option [ngValue]="0.25">25%</option>
          </select>
        </div>
        
        <div class="summary-item total">
          <span>Total with Tax (memoized):</span>
          <strong>{{ totalWithTax() | currency }}</strong>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h4>Performance Comparison</h4>
      <p>Open browser console to see computation logs.</p>
      
      <div class="perf-info">
        <p><strong>Memoized Computations:</strong> {{ computationCount() }}</p>
        <button (click)="store.resetComputationCount()">Reset Count</button>
      </div>
      
      <p class="info">
        <em>
          Memoized selectors cache their results and only recompute when dependencies change.
          Non-memoized selectors recompute on every change detection cycle.
        </em>
      </p>
    </div>

    <div class="code-section">
      <h4>Code Examples</h4>
      <pre><code>// Signal Store - Memoized selector
const subtotal = store.selectStateMemoized(state => &#123;
  // This only runs when products actually change
  return state.products.reduce(
    (sum, p) => sum + (p.price * p.quantity), 
    0
  );
&#125;);

// RxJS Store - Memoized selector with key
const subtotal$ = store.selectStateMemoized(
  'subtotal',  // Unique key for caching
  state => state.products.reduce(
    (sum, p) => sum + (p.price * p.quantity), 
    0
  )
);

// Regular selector (not memoized)
const products = store.selectState(state => state.products);</code></pre>
    </div>
  `,
  styles: [`
    .demo-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f5f5f5;
    }
    .add-product {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .summary-grid {
      display: grid;
      gap: 15px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .summary-item.total {
      background: #e7f3ff;
      font-size: 1.1em;
    }
    button {
      padding: 8px 16px;
      cursor: pointer;
    }
    button.small {
      padding: 4px 10px;
      font-size: 12px;
    }
    .perf-info {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px;
      background: #fff3cd;
      border-radius: 4px;
    }
    .info {
      color: #666;
    }
    .code-section {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  `],
  imports: [CommonModule, FormsModule, CurrencyPipe],
  providers: [SelectorsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectorsDemoComponent {
  store = inject(SelectorsStore);
  
  products: Signal<Product[]> = this.store.selectProducts();
  taxRate: Signal<number> = this.store.selectTaxRate();
  discount: Signal<number> = this.store.selectDiscount();
  computationCount: Signal<number> = this.store.selectComputationCount();
  
  // Memoized selectors
  subtotal: Signal<number> = this.store.selectSubtotalMemoized();
  totalWithTax: Signal<number> = this.store.selectTotalWithTaxMemoized();
}
