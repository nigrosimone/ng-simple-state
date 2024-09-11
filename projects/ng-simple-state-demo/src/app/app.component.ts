import { Component } from '@angular/core';
import { TestComponent } from './component/test.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
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
