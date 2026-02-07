import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-features',
  template: `
    <h2>New Features Demo (v21.1.0+)</h2>
    <nav>
      <ul>
        <li><a routerLink="effects" routerLinkActive="active">Effects</a></li>
        <li><a routerLink="linked-signals" routerLinkActive="active">Linked Signals</a></li>
        <li><a routerLink="plugins" routerLinkActive="active">Plugins</a></li>
        <li><a routerLink="batch" routerLinkActive="active">Batch Updates</a></li>
      </ul>
    </nav>
    <hr />
    <router-outlet></router-outlet>
  `,
  styles: [`
    nav ul {
      display: flex;
      gap: 10px;
      list-style: none;
      padding: 0;
      flex-wrap: wrap;
    }
    nav a {
      padding: 5px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      text-decoration: none;
    }
    nav a.active {
      background: #007bff;
      color: white;
    }
  `],
  imports: [RouterModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesComponent {}
