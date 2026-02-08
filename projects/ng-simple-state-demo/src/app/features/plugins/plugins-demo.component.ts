import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PluginsState, PluginsStore } from './plugins.store';
import { NG_SIMPLE_STATE_UNDO_REDO, NgSimpleStateUndoRedoPlugin } from 'projects/ng-simple-state/src/public-api';

@Component({
  selector: 'app-plugins-demo',
  template: `
    <h3>Undo/Redo Plugin Demo</h3>
    <p>The undoRedoPlugin enables state history with undo/redo capabilities.</p>
    
    <div class="demo-section">
      <h4>Items List</h4>
      <p><strong>Count:</strong> {{ itemCount() }} | <strong>Last Action:</strong> {{ lastAction() }}</p>
      
      <ul>
        @for (item of items(); track item; let i = $index) {
          <li>
            {{ item }}
            <button class="small" (click)="store.removeItem(i)">Remove</button>
          </li>
        } @empty {
          <li><em>No items</em></li>
        }
      </ul>
      
      <div class="actions">
        <input #newItem type="text" placeholder="New item..." />
        <button (click)="store.addItem(newItem.value); newItem.value = ''">Add Item</button>
        <button (click)="store.shuffleItems()">Shuffle</button>
        <button (click)="store.clearItems()">Clear All</button>
      </div>
      
      <div class="undo-redo-actions">
        <button [disabled]="!canUndo()" (click)="undo()">⬅ Undo</button>
        <button [disabled]="!canRedo()" (click)="redo()">Redo ➡</button>
      </div>
      
    </div>

    <div class="code-section">
      <h4>Configuration</h4>
      <pre><code>import &#123; provideNgSimpleState, undoRedoPlugin &#125; from 'ng-simple-state';

// Create plugin instance
const undoRedo = undoRedoPlugin(&#123; maxHistory: 50 &#125;);

bootstrapApplication(AppComponent, &#123;
  providers: [
    provideNgSimpleState(&#123;
      enableDevTool: isDevMode(),
      plugins: [undoRedo]
    &#125;)
  ]
&#125;);</code></pre>
    </div>

    <div class="code-section">
      <h4>Usage in Component</h4>
      <pre><code>// Check availability
undoRedo.canUndo('MyStore')  // boolean
undoRedo.canRedo('MyStore')  // boolean

// Get previous/next state
const prevState = undoRedo.undo('MyStore');
if (prevState) &#123;
  store.replaceState(prevState);
&#125;

const nextState = undoRedo.redo('MyStore');
if (nextState) &#123;
  store.replaceState(nextState);
&#125;

// Clear history
undoRedo.clearHistory('MyStore');</code></pre>
    </div>

    <div class="code-section">
      <h4>Custom Plugin Interface</h4>
      <pre><code>import &#123; NgSimpleStatePlugin, NgSimpleStatePluginContext &#125; from 'ng-simple-state';

const myPlugin: NgSimpleStatePlugin = &#123;
  name: 'myPlugin',
  
  onBeforeStateChange(context) &#123;
    // Return false to prevent state change
  &#125;,
  
  onAfterStateChange(context) &#123;
    // Called after state change
  &#125;,
  
  onStoreInit(storeName, initialState) &#123;
    // Called when store initializes
  &#125;,
  
  onStoreDestroy(storeName) &#123;
    // Called when store is destroyed
  &#125;
&#125;;</code></pre>
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
      margin-top: 15px;
    }
    button {
      padding: 8px 16px;
      cursor: pointer;
    }
    button.small {
      padding: 2px 8px;
      font-size: 12px;
    }
    .plugin-list {
      display: grid;
      gap: 15px;
    }
    .plugin {
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .plugin code {
      display: block;
      margin-top: 5px;
      background: #eee;
      padding: 5px;
      font-size: 12px;
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
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      padding: 5px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .undo-redo-actions {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px dashed #ccc;
      display: flex;
      gap: 10px;
    }
    .undo-redo-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
  imports: [CommonModule, FormsModule],
  providers: [PluginsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginsDemoComponent {
  store = inject(PluginsStore);
  private readonly undoRedo = inject(NG_SIMPLE_STATE_UNDO_REDO) as NgSimpleStateUndoRedoPlugin<PluginsState>;
  
  items: Signal<string[]> = this.store.selectItems();
  lastAction: Signal<string> = this.store.selectLastAction();
  itemCount: Signal<number> = this.store.selectItemCount();
  
  private readonly storeName = 'PluginsStore';
  
  canUndo: Signal<boolean> = this.undoRedo.selectCanUndo(this.storeName);
  canRedo: Signal<boolean> = this.undoRedo.selectCanRedo(this.storeName);
  
  undo(): void {
    const prevState = this.undoRedo.undo(this.storeName);
    if (prevState) {
      this.store.replaceState(prevState);
    }
  }
  
  redo(): void {
    const nextState = this.undoRedo.redo(this.storeName);
    if (nextState) {
      this.store.replaceState(nextState);
    }
  }
}
