import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EffectsStore } from './effects.store';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-effects-demo',
  template: `
    <h3>Effects Demo</h3>
    <p>Effects are functions that run in response to state changes.</p>
    
    <div class="demo-section">
      <h4>Current State</h4>
      <p><strong>Count:</strong> {{ count() }}</p>
      <p><strong>Last Action:</strong> {{ lastAction() }}</p>
      
      <div class="actions">
        <button (click)="store.decrement()">-1</button>
        <button (click)="store.increment()">+1</button>
        <input type="number" [(ngModel)]="customValue" style="width: 60px" />
        <button (click)="store.setCount(customValue)">Set Value</button>
      </div>
    </div>

    <div class="demo-section">
      <h4>Effect Controls</h4>
      <p>Effects can be registered and unregistered dynamically.</p>
      <div class="effect-buttons">
        <div>
          <strong>Logger Effect:</strong>
          <button (click)="store.registerLoggerEffect()">Register</button>
          <button (click)="store.unregisterLoggerEffect()">Unregister</button>
        </div>
        <div>
          <strong>CountWatcher Effect:</strong>
          <button (click)="store.registerCountWatcherEffect()">Register</button>
          <button (click)="store.unregisterCountWatcherEffect()">Unregister</button>
        </div>
      </div>
      <p><em>Open browser console to see effect logs</em></p>
    </div>

    <div class="demo-section">
      <h4>History (from countWatcher effect)</h4>
      <button (click)="store.clearHistory()">Clear History</button>
      <ul>
        @for (entry of history(); track $index) {
          <li>{{ entry }}</li>
        } @empty {
          <li><em>No history yet - change the count to see entries</em></li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .demo-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 10px;
    }
    .effect-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 10px 0;
    }
    .effect-buttons div {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    button {
      padding: 8px 16px;
      cursor: pointer;
    }
    ul {
      max-height: 200px;
      overflow-y: auto;
    }
  `],
  imports: [FormsModule],
  providers: [EffectsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsDemoComponent {
  store = inject(EffectsStore);
  
  count: Signal<number> = this.store.selectCount();
  lastAction: Signal<string> = this.store.selectLastAction();
  history: Signal<string[]> = this.store.selectHistory();
  
  customValue = 10;
}
