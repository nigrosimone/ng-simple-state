# NgSimpleState [![Build Status](https://travis-ci.com/nigrosimone/ng-simple-state.svg?branch=main)](https://travis-ci.com/nigrosimone/ng-simple-state) [![Coverage Status](https://coveralls.io/repos/github/nigrosimone/ng-simple-state/badge.svg?branch=main)](https://coveralls.io/github/nigrosimone/ng-simple-state?branch=main) [![NPM version](https://img.shields.io/npm/v/ng-simple-state.svg)](https://www.npmjs.com/package/ng-simple-state) [![Maintainability](https://api.codeclimate.com/v1/badges/1bfc363a95053ecc3429/maintainability)](https://codeclimate.com/github/nigrosimone/ng-simple-state/maintainability)

Angular simple state manager.

## Description

Sharing state between components as simple as possible and leverage the good parts of component state and Angular's dependency injection system.

See the [stackblitz demo](https://stackblitz.com/edit/demo-ng-simple-state?file=src%2Fapp%2Fapp.component.ts).

## Get Started

### Step 1: install `ng-simple-state`

```bash
npm i ng-simple-state
```

### Step 2: Import `NgSimpleStateModule` into your `AppModule`

`ng-simple-state` support `Redux DevTools` browser extension for inspect the state of the store.
The `Redux DevTools` is enabled only if `enableDevTool` option is true. 
In this example `Redux DevTools` is enabled only in developing mode.

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
    NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production, // Enable Redux DevTools only in developing
      enableLocalStorage: false // Enable local storage state persistence
    }) 
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Step 3: Create your store

This is an example for a counter store in a `src/app/counter-store.ts` file. 
Obviously, you can create every store you want with every complexity you need.

1) Define yuor state interface, eg.:

```ts
export interface CounterState {
    count: number;
}
```

2) Define your store service by extending `NgSimpleStateBaseStore`, eg.:

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
      count: 0
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
      count: 0
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
import { NgSimpleStateBaseStore } from "ng-simple-state";
import { Observable } from "rxjs";

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  initialState(): CounterState {
    return {
      count: 0
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
    NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production, // Enable Redux DevTools only in developing
      enableLocalStorage: false // Enable local storage state persistence
    })
  ],
  bootstrap: [AppComponent],
  providers: [CounterStore]  // The CounterStore state is shared at AppModule level
})
export class AppModule {}
```

### Step 4: Use your store into the components, eg.:

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  template: `
  <h1>Counter: {{ counter$ | async }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.resetState()">Reset</button>
  <button (click)="counterStore.increment()">Increment</button>
  `,
})
export class AppComponent {
  public counter$: Observable<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectCount();
  }
}
```

### That's all!

![alt text](https://github.com/nigrosimone/ng-simple-state/blob/main/projects/ng-simple-state-demo/src/assets/dev-tool.gif?raw=true)

## Store's dependency injection and specific config

If you need to inject something into your store (eg. `HttpClient`), you need to also inject the Angular `Injector` service to the super, eg.:

```ts
import { Injectable, Injector } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { NgSimpleStateBaseStore } from 'ng-simple-state';

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  constructor(injector: Injector, private http: HttpClient) {
    super(injector);
  }

  increment(increment: number = 1): void {
    this.http.post<CounterState>('https://localhost:300/api/increment', { increment }).subscribe(response => {
      // setState() from default use parent function name as action name for Redux DevTools.
      // In this case we provide a second parameter `actionName` because the parent function is anonymous function
      this.setState(() => ({ count: response.count }), 'increment');
    });
  }

}
```

If you need to override the module configuration provided by `NgSimpleStateModule.forRoot()` you can implement `storeConfig()` and return a specific configuration for the single store, eg.:

```ts
import { Injectable } from "@angular/core";
import { NgSimpleStateStoreConfig } from "ng-simple-state";


@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig {
    return {
      enableLocalStorage: true // enable local storage for this store
      storeName: 'CounterStore2', // For default the store name is the class name, you can set a specific name for this store (must be be unique)
    }
  }
}
```
## Alternatives

Aren't you satisfied? there are some valid alternatives:

 - [@tinystate](https://www.npmjs.com/package/@tinystate/core)
 - [@ngxs](https://www.npmjs.com/package/@ngxs/store)
## Support

This is an open-source project. Star this [repository](https://github.com/nigrosimone/ng-simple-state), if you like it, or even [donate](https://www.paypal.com/paypalme/snwp). Thank you so much!
