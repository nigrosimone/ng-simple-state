import { Injectable, Signal, WritableSignal, computed } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';

export interface LinkedSignalsState {
  celsius: number;
  firstName: string;
  lastName: string;
}

@Injectable()
export class LinkedSignalsStore extends NgSimpleStateBaseSignalStore<LinkedSignalsState> {
  
  // Linked signal that computes Fahrenheit from Celsius
  fahrenheit: WritableSignal<number> = this.linkedState({
    source: state => state.celsius,
    computation: (celsius) => (celsius * 9/5) + 32
  });

  // Computed signal for full name (read-only derived state)
  fullName = computed(() => {
    const state = this.getCurrentState();
    return `${state.firstName} ${state.lastName}`.trim();
  });

  storeConfig(): NgSimpleStateStoreConfig<LinkedSignalsState> {
    return {
      storeName: 'LinkedSignalsStore'
    };
  }

  initialState(): LinkedSignalsState {
    return {
      celsius: 20,
      firstName: 'John',
      lastName: 'Doe'
    };
  }

  // Selectors
  selectCelsius(): Signal<number> {
    return this.selectState(state => state.celsius);
  }

  selectFirstName(): Signal<string> {
    return this.selectState(state => state.firstName);
  }

  selectLastName(): Signal<string> {
    return this.selectState(state => state.lastName);
  }

  // Actions
  setCelsius(value: number): void {
    this.setState({ celsius: value });
  }

  setFahrenheit(fahrenheit: number): void {
    // Convert Fahrenheit to Celsius and update store
    const celsius = (fahrenheit - 32) * 5/9;
    this.setState({ celsius: Math.round(celsius * 100) / 100 });
  }

  setFirstName(name: string): void {
    this.setState({ firstName: name });
  }

  setLastName(name: string): void {
    this.setState({ lastName: name });
  }

  setFullName(fullName: string): void {
    const parts = fullName.split(' ');
    this.setState({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    });
  }
}
