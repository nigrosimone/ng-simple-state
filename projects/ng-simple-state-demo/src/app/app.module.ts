import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'ng-simple-state';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
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
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
