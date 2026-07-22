import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateBaseRxjsStore } from '../rxjs/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';

interface UserState {
  count: number;
  name: string;
}

/** A state-level comparator: two states are equal when their `count` matches. */
const stateComparator = (previous: UserState, current: UserState) =>
  previous.count === current.count;

describe('Regression: store comparator must not be applied to selected slices', () => {
  it('signal store: a slice selector keeps emitting on a state change the comparator allows', () => {
    @Injectable()
    class SignalStore extends NgSimpleStateBaseSignalStore<UserState> {
      protected storeConfig(): NgSimpleStateStoreConfig<UserState> {
        return { storeName: 'SliceComparatorSignalStore', comparator: stateComparator };
      }
      initialState(): UserState {
        return { count: 0, name: 'a' };
      }
      // `count` changes too, so the store comparator lets the update through:
      // only the slice comparison can wrongly swallow it
      rename(count: number, name: string): boolean {
        return this.setState({ count, name });
      }
    }

    TestBed.configureTestingModule({ providers: [SignalStore] });
    const store = TestBed.inject(SignalStore);
    const name = store.selectState((state) => state.name);

    expect(name()).toBe('a');
    expect(store.rename(1, 'b')).toBeTrue();
    expect(name()).toBe('b');
  });

  it('signal store: the comparator still guards full-state updates', () => {
    @Injectable()
    class SignalStore extends NgSimpleStateBaseSignalStore<UserState> {
      protected storeConfig(): NgSimpleStateStoreConfig<UserState> {
        return { storeName: 'FullStateComparatorSignalStore', comparator: stateComparator };
      }
      initialState(): UserState {
        return { count: 0, name: 'a' };
      }
    }

    TestBed.configureTestingModule({ providers: [SignalStore] });
    const store = TestBed.inject(SignalStore);

    // same count -> the comparator considers the states equal -> update rejected
    expect(store.replaceState({ count: 0, name: 'z' })).toBeFalse();
    expect(store.replaceState({ count: 1, name: 'z' })).toBeTrue();
  });

  it('signal store: an explicit selector comparator still wins', () => {
    @Injectable()
    class SignalStore extends NgSimpleStateBaseSignalStore<UserState> {
      protected storeConfig(): NgSimpleStateStoreConfig<UserState> {
        return { storeName: 'ExplicitComparatorSignalStore' };
      }
      initialState(): UserState {
        return { count: 0, name: 'a' };
      }
      setName(name: string): boolean {
        return this.setState({ name });
      }
    }

    TestBed.configureTestingModule({ providers: [SignalStore] });
    const store = TestBed.inject(SignalStore);
    // case-insensitive equality: 'A' and 'a' are the same value
    const name = store.selectState(
      (state) => state.name,
      (a, b) => a.toLowerCase() === b.toLowerCase(),
    );

    expect(name()).toBe('a');
    store.setName('A');
    expect(name()).toBe('a');
    store.setName('b');
    expect(name()).toBe('b');
  });

  it('rxjs store: a slice selector keeps emitting on a state change the comparator allows', () =>
    new Promise<void>((done) => {
      @Injectable()
      class RxjsStore extends NgSimpleStateBaseRxjsStore<UserState> {
        protected storeConfig(): NgSimpleStateStoreConfig<UserState> {
          return { storeName: 'SliceComparatorRxjsStore', comparator: stateComparator };
        }
        initialState(): UserState {
          return { count: 0, name: 'a' };
        }
        // `count` changes too, so the store comparator lets the update through:
        // only the slice comparison can wrongly swallow it
        rename(count: number, name: string): boolean {
          return this.setState({ count, name });
        }
      }

      TestBed.configureTestingModule({ providers: [RxjsStore] });
      const store = TestBed.inject(RxjsStore);

      const emitted: string[] = [];
      store.selectState((state) => state.name).subscribe((value) => emitted.push(value));
      store.rename(1, 'b');

      setTimeout(() => {
        expect(emitted).toEqual(['a', 'b']);
        done();
      }, 50);
    }));
});
