import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'projects/ng-simple-state/src/public-api';
import { environment } from '../environments/environment';
import { TodoModule } from './todo/todo.module';
import { CounterModule } from './counter/counter.module';
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production,
      enableLocalStorage: true
    }),
    TodoModule,
    CounterModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
