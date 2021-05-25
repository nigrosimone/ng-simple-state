import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterComponent } from './counter.component';
import {CounterStore} from './counter-store';


@NgModule({
  declarations: [
    CounterComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [CounterComponent],
  providers: [
    CounterStore
  ]
})
export class CounterModule { }
