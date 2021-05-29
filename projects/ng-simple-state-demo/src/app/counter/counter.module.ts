import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterComponent } from './counter.component';
import {CounterStore} from './counter-store';
import { CounterRoutingModule } from './counter-routing.module';

@NgModule({
  declarations: [
    CounterComponent
  ],
  imports: [
    CommonModule,
    CounterRoutingModule
  ],
  exports: [CounterComponent],
  providers: [
    CounterStore
  ]
})
export class CounterModule { }
