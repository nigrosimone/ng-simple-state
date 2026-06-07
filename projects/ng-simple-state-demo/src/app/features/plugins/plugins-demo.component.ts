import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { PluginsState, PluginsStore } from './plugins.store';
import { NG_SIMPLE_STATE_UNDO_REDO, NgSimpleStateUndoRedoPlugin, NgSimpleStateUndoRedoForStore } from 'ng-simple-state';

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
  imports: [],
  providers: [PluginsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginsDemoComponent {
  store = inject(PluginsStore);
  private readonly undoRedo = inject<NgSimpleStateUndoRedoPlugin<PluginsState>>(NG_SIMPLE_STATE_UNDO_REDO);
  private readonly history: NgSimpleStateUndoRedoForStore = this.undoRedo.forStore(this.store);
  
  items: Signal<string[]> = this.store.selectItems();
  lastAction: Signal<string> = this.store.selectLastAction();
  itemCount: Signal<number> = this.store.selectItemCount();
  
  canUndo: Signal<boolean> = this.history.selectCanUndo();
  canRedo: Signal<boolean> = this.history.selectCanRedo();
  
  undo(): void {
    this.history.undo();
  }
  
  redo(): void {
    this.history.redo();
  }
}
