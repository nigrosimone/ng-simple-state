import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'projects/ng-simple-state/src/public-api';

export interface PluginsState {
  items: string[];
  lastAction: string;
}

@Injectable()
export class PluginsStore extends NgSimpleStateBaseSignalStore<PluginsState> {
  
  storeConfig(): NgSimpleStateStoreConfig<PluginsState> {
    return {
      storeName: 'PluginsStore'
    };
  }

  initialState(): PluginsState {
    return {
      items: ['Item 1', 'Item 2'],
      lastAction: 'init'
    };
  }

  // Selectors
  selectItems(): Signal<string[]> {
    return this.selectState(state => state.items);
  }

  selectLastAction(): Signal<string> {
    return this.selectState(state => state.lastAction);
  }

  selectItemCount(): Signal<number> {
    return this.selectState(state => state.items.length);
  }

  // Actions
  addItem(item: string): void {
    this.setState(state => ({
      items: [...state.items, item],
      lastAction: `addItem("${item}")`
    }));
  }

  removeItem(index: number): void {
    this.setState(state => ({
      items: state.items.filter((_, i) => i !== index),
      lastAction: `removeItem(${index})`
    }));
  }

  clearItems(): void {
    this.setState({
      items: [],
      lastAction: 'clearItems'
    });
  }

  shuffleItems(): void {
    this.setState(state => ({
      items: [...state.items].sort(() => Math.random() - 0.5),
      lastAction: 'shuffleItems'
    }));
  }
}
