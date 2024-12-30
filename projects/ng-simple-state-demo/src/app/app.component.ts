import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroService } from './tour-of-heroes/hero.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  template: `<h1>NgSimpleState demos</h1>
  <nav>
      <ul>
        <li><a routerLink="/todo" routerLinkActive="active">Todo</a></li>
        <li><a routerLink="/counter" routerLinkActive="active">Counter</a></li>
        <li><a routerLink="/tour" routerLinkActive="active">Tour of heroes</a></li>
      </ul>
  </nav>
  <hr />
  <router-outlet></router-outlet>
  `,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],
  providers: [HeroService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

}
