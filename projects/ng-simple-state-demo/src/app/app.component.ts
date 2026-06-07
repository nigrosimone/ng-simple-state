import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  template: `<h1>NgSimpleState demos</h1>
  <router-outlet></router-outlet>
  `,
  imports: [
    RouterOutlet
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

}
