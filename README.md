# NgSimpleState [![Build Status](https://travis-ci.com/nigrosimone/ng-simple-state.svg?branch=main)](https://travis-ci.com/nigrosimone/ng-simple-state) [![Coverage Status](https://coveralls.io/repos/github/nigrosimone/ng-simple-state/badge.svg?branch=main)](https://coveralls.io/github/nigrosimone/ng-simple-state?branch=main) [![NPM version](https://img.shields.io/npm/v/ng-simple-state.svg)](https://www.npmjs.com/package/ng-simple-state)

Angular simple state manager.

## Description

Sharing state between components as simple as possible and leverage the good parts of component state and Angular's dependency injection system.

See the [stackblitz demo](https://stackblitz.com/edit/demo-ng-simple-state?file=src%2Fapp%2Fapp.component.ts).

## Get Started

### Step 1: install `ng-simple-state`

```bash
npm i ng-simple-state
```

### Step 2: Import `NgConditionModule` into your app module, eg.:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'ng-simple-state';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    NgSimpleStateModule.forRoot({enableDevTool: !environment.production}) // enable dev tool only in developing
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Step 3: Create your store

This is an example for a counter store in a `src/app/counter-store.ts` file.

1) Define yuor state interface:

```ts
export interface CounterState {
    count: number;
}
```

2) Define yuor store service by extending `NgSimpleStateBaseStore`, eg.:

```ts
import { Injectable } from "@angular/core";
import { NgSimpleStateBaseStore } from "ng-simple-state";

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
 
}
```

3) Implement `initialState()` method and provide the initial state of the store, eg.:

```ts
import { Injectable } from "@angular/core";
import { NgSimpleStateBaseStore } from "ng-simple-state";

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
  
  initialState(): CounterState {
    return {
      count: 1
    };
  }

}
```

4) Implement one or more selectors of the partial state you want, in this example `selectCount()` eg.:

```ts
import { Injectable } from "@angular/core";
import { NgSimpleStateBaseStore } from "ng-simple-state";
import { Observable } from "rxjs";

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
  
  initialState(): CounterState {
    return {
      count: 1
    };
  }

  selectCount(): Observable<number> {
    return this.selectState(state => state.count);
  }
}
```
 
5) Implement one or more actions for change the store state, in this example `increment()` and `decrement()` eg.:

```ts
import { Injectable } from "@angular/core";
import { NgSimpleStateBaseStore } from "ng-simple-statei";
import { Observable } from "rxjs";

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  initialState(): CounterState {
    return {
      count: 1
    };
  }

  selectCount(): Observable<number> {
    return this.selectState(state => state.count);
  }

  increment(increment: number = 1): void {
    this.setState(state => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.setState(state => ({ count: state.count - decrement }));
  }
}
```

### Step 3: Inject your store into the providers of the module you want (or the providers of component), eg.:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'ng-simple-state';
import { environment } from '../environments/environment';
import { CounterStore } from './counter-store';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    NgSimpleStateModule.forRoot({enableDevTool: !environment.production}) // enable dev tool only in developing
  ],
  bootstrap: [AppComponent],
  providers: [CounterStore]  // The CounterStore state is shared at AppModule level
})
export class AppModule {}
```

### Step 4: Use your store into the component, eg.:

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  template: `
  <h1>Counter: {{ counter$ | async }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.increment()">Increment</button>
  `,
})
export class AppComponent {
  public counter$: Observable<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectState(state => state.count);
  }
}
```

## Support

This is an open-source project. Star this [repository](https://github.com/nigrosimone/ng-simple-state), if you like it, or even [donate](https://www.paypal.com/paypalme/snwp). Thank you so much!
