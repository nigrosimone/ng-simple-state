import { Component } from '@angular/core';
import { TestComponent } from './component/test.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  template: `<h1>NgSimpleState demos</h1>
  <nav>
      <ul>
        <li><a routerLink="/todo" routerLinkActive="active">Todo</a></li>
        <li><a routerLink="/counter" routerLinkActive="active">Counter</a></li>
      </ul>
  </nav>
  <router-outlet></router-outlet>
  
  <br /><br /><br />
  <ng-test></ng-test><br />
  <ng-test></ng-test><br />
  <ng-test></ng-test><br />`,
  standalone: true,
  imports: [
    TestComponent,
    FormsModule,
    CommonModule,
    RouterModule
  ]
})
export class AppComponent {

}
