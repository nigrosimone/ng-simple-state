import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchStore } from './batch.store';
import { withTransaction } from 'projects/ng-simple-state/src/public-api';

@Component({
  selector: 'app-batch-demo',
  template: `
    <h3>Batch Updates Demo</h3>
    <p>Group multiple state updates into single emissions for better performance.</p>
    
    <div class="demo-section">
      <h4>Current State</h4>
      <div class="state-grid">
        <div class="state-item">
          <span class="label">A:</span>
          <span class="value">{{ a() }}</span>
        </div>
        <div class="state-item">
          <span class="label">B:</span>
          <span class="value">{{ b() }}</span>
        </div>
        <div class="state-item">
          <span class="label">C:</span>
          <span class="value">{{ c() }}</span>
        </div>
        <div class="state-item">
          <span class="label">Sum:</span>
          <span class="value">{{ sum() }}</span>
        </div>
      </div>
      <p><strong>Update Count:</strong> {{ updateCount() }} | <strong>Last:</strong> {{ lastUpdate() }}</p>
    </div>

    <div class="demo-section">
      <h4>Individual Updates (3 emissions)</h4>
      <p>Each setState() triggers a separate emission.</p>
      <button (click)="store.updateIndividually()">Update A, B, C Individually</button>
      <div class="actions">
        <button (click)="store.incrementA()">A++</button>
        <button (click)="store.incrementB()">B++</button>
        <button (click)="store.incrementC()">C++</button>
      </div>
    </div>

    <div class="demo-section">
      <h4>Transactions</h4>
      <p>Transactions can rollback on error.</p>
      <button (click)="runTransaction()">Run Transaction (success)</button>
      <button (click)="runFailingTransaction()">Run Failing Transaction (rollback)</button>
      <p class="info">{{ transactionStatus }}</p>
    </div>

    <div class="demo-section">
      <h4>Debounced & Throttled Updates</h4>
      <p>Rate-limit state updates.</p>
      <button (click)="debouncedIncrement()">Debounced A++ (300ms)</button>
      <button (click)="throttledIncrement()">Throttled B++ (500ms)</button>
      <p><em>Click rapidly to see the difference</em></p>
    </div>

    <button (click)="store.resetCounters()" class="reset">Reset All</button>

    <div class="code-section">
      <h4>Code Examples</h4>
      <pre><code>import &#123; withTransaction &#125; from 'ng-simple-state';

// Transaction with automatic rollback on error
await withTransaction(store, async (tx) => &#123;
  store.setState(&#123; step: 1 &#125;);
  await apiCall(); // If this fails, state rolls back
  store.setState(&#123; step: 2 &#125;);
  tx.commit();
&#125;);

// Create rate-limited updaters
const debouncedUpdate = createDebouncedUpdater(300);
const throttledUpdate = createThrottledUpdater(500);</code></pre>
    </div>
  `,
  styles: [`
    .demo-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .state-grid {
      display: flex;
      gap: 20px;
      margin: 10px 0;
    }
    .state-item {
      padding: 10px 20px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .state-item .label {
      font-weight: bold;
      margin-right: 5px;
    }
    .state-item .value {
      font-size: 1.2em;
      color: #007bff;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    button {
      padding: 8px 16px;
      cursor: pointer;
    }
    button.reset {
      margin-top: 20px;
      background: #dc3545;
      color: white;
      border: none;
    }
    .info {
      color: #666;
      font-style: italic;
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
  imports: [CommonModule],
  providers: [BatchStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchDemoComponent {
  store = inject(BatchStore);
  
  a: Signal<number> = this.store.selectA();
  b: Signal<number> = this.store.selectB();
  c: Signal<number> = this.store.selectC();
  sum: Signal<number> = this.store.selectSum();
  updateCount: Signal<number> = this.store.selectUpdateCount();
  lastUpdate: Signal<string> = this.store.selectLastUpdate();
  
  transactionStatus = '';
  
  // Simple debounce/throttle state
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastThrottle = 0;

  async runTransaction(): Promise<void> {
    this.transactionStatus = 'Running transaction...';
    try {
      await withTransaction(this.store, async (tx) => {
        this.store.incrementA();
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));
        this.store.incrementB();
        tx.commit();
      });
      this.transactionStatus = 'Transaction committed successfully!';
    } catch (e) {
      this.transactionStatus = 'Transaction failed: ' + e;
    }
  }

  async runFailingTransaction(): Promise<void> {
    this.transactionStatus = 'Running failing transaction...';
    const beforeState = this.store.getCurrentState();
    try {
      await withTransaction(this.store, async () => {
        this.store.incrementA();
        this.store.incrementB();
        // Simulate error
        throw new Error('Simulated failure!');
        // tx.commit(); - never reached
      });
    } catch (_) {
      this.transactionStatus = `Transaction rolled back! State restored to: A=${beforeState.a}, B=${beforeState.b}`;
    }
  }

  debouncedIncrement(): void {
    // Simple debounce implementation for demo
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.store.incrementA();
      this.debounceTimeout = null;
    }, 300);
  }

  throttledIncrement(): void {
    // Simple throttle implementation for demo
    const now = Date.now();
    if (now - this.lastThrottle >= 500) {
      this.lastThrottle = now;
      this.store.incrementB();
    }
  }
}
