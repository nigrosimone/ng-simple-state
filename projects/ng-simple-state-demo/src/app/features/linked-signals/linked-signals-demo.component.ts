import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinkedSignalsStore } from './linked-signals.store';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-linked-signals-demo',
  template: `
    <h3>Linked Signals Demo (Angular 21+)</h3>
    <p>Linked signals create bidirectional computed values from store state using Angular's linkedSignal.</p>
    
    <div class="demo-section">
      <h4>Temperature Converter</h4>
      <p>The Fahrenheit signal is linked to Celsius in the store.</p>
      
      <div class="row">
        <label>
          <strong>Celsius:</strong>
          <input 
            type="number" 
            [ngModel]="celsius()" 
            (ngModelChange)="store.setCelsius($event)"
            style="width: 80px"
          />
          °C
        </label>
      </div>
      
      <div class="row">
        <label>
          <strong>Fahrenheit (linked):</strong>
          <input 
            type="number" 
            [ngModel]="store.fahrenheit()" 
            (ngModelChange)="store.setFahrenheit($event)"
            style="width: 80px"
          />
          °F
        </label>
      </div>
      
      <p class="info">
        <em>Change either value - the store updates and the linked signal recalculates!</em>
      </p>
    </div>

    <div class="demo-section">
      <h4>Name Composition</h4>
      <p>The fullName signal is linked to firstName and lastName in the store.</p>
      
      <div class="row">
        <label>
          <strong>First Name:</strong>
          <input 
            type="text" 
            [ngModel]="firstName()" 
            (ngModelChange)="store.setFirstName($event)"
          />
        </label>
      </div>
      
      <div class="row">
        <label>
          <strong>Last Name:</strong>
          <input 
            type="text" 
            [ngModel]="lastName()" 
            (ngModelChange)="store.setLastName($event)"
          />
        </label>
      </div>
      
      <div class="row">
        <label>
          <strong>Full Name (computed):</strong>
          <span>{{ store.fullName() }}</span>
        </label>
      </div>
      <div class="row">
        <label>
          <strong>Set Full Name:</strong>
          <input 
            type="text" 
            #fullNameInput
            [value]="store.fullName()"
          />
          <button (click)="store.setFullName(fullNameInput.value)">Set</button>
        </label>
      </div>
    </div>

    <div class="code-section">
      <h4>Code Example</h4>
      <pre><code>// In your Signal Store
fahrenheit = this.linkedState(&#123;
  source: state => state.celsius,
  computation: (celsius) => (celsius * 9/5) + 32
&#125;);

// Linked signal for combining multiple properties
fullName = this.linkedState(&#123;
  source: state => (&#123; first: state.firstName, last: state.lastName &#125;),
  computation: (&#123; first, last &#125;) => \`$&#123;first&#125; $&#123;last&#125;\`.trim()
&#125;);</code></pre>
    </div>
  `,
  styles: [`
    .demo-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .row {
      margin: 10px 0;
    }
    label {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    input {
      padding: 5px;
    }
    .info {
      color: #666;
      margin-top: 15px;
    }
    .code-section {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  `],
  imports: [CommonModule, FormsModule],
  providers: [LinkedSignalsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkedSignalsDemoComponent {
  store = inject(LinkedSignalsStore);
  
  celsius: Signal<number> = this.store.selectCelsius();
  firstName: Signal<string> = this.store.selectFirstName();
  lastName: Signal<string> = this.store.selectLastName();
}
