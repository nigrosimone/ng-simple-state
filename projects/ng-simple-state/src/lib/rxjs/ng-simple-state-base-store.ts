import { Injectable, inject, Directive, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler, Subject, takeUntil } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';
import type {
  NgSimpleStateComparator,
  NgSimpleStateReplaceState,
  NgSimpleStateSelectState,
  NgSimpleStateSetState,
  StateFnOrNewState,
  StateFnOrReplaceState,
} from '../ng-simple-state-models';

@Injectable()
@Directive()
export abstract class NgSimpleStateBaseRxjsStore<
  S extends object | Array<any>,
> extends NgSimpleStateBaseCommonStore<S> {
  private readonly state$: BehaviorSubject<S> = new BehaviorSubject<S>(this._firstState);
  private readonly stateObs: Observable<S> = this.state$.asObservable();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
      this.state$.complete();
    });
  }

  /**
   * Apply state directly from DevTools time-travel.
   * Sets the BehaviorSubject without triggering devtool send or plugins.
   * @internal
   */
  protected _applyDevToolState(state: S): void {
    this.state$.next(state);
  }

  /**
   * Return the observable of the state
   * @returns Observable of the state
   */
  public get state(): Observable<S> {
    return this.stateObs;
  }

  /**
   * Select a store state
   * @param selectFn State selector (if not provided return full state)
   * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
   * @returns Observable of the selected state
   */
  selectState<K = Partial<S>>(
    selectFn?: NgSimpleStateSelectState<S, K>,
    comparator?: NgSimpleStateComparator<K>,
  ): Observable<K> {
    if (!selectFn) {
      return this.stateObs as unknown as Observable<K>;
    }
    // NB: the store level comparator compares two full states (S) and must not be
    // reused here, where the compared values are the selected slice (K).
    return this.state$.pipe(
      map((state) => selectFn(state as Readonly<S>)),
      distinctUntilChanged(comparator),
      observeOn(asyncScheduler),
    );
  }

  /**
   * Create an effect from an observable
   * @param name Unique effect name
   * @param source$ Observable source
   * @param effectFn Effect function that receives the observable value
   */
  private createEffectFromObservable<T>(
    name: string,
    source$: Observable<T>,
    effectFn: (value: T) => void,
  ): void {
    // Cleanup existing effect with same name
    this.destroyEffect(name);

    const subscription = source$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      effectFn(value);
    });

    this._registeredEffects.set(name, subscription.unsubscribe.bind(subscription));
  }

  /**
   * Create an effect that reacts to state changes
   * @param name Unique effect name
   * @param effectFn Effect function that receives current state
   */
  createEffect(name: string, effectFn: (state: S) => void): void {
    this.createEffectFromObservable(name, this.state$, effectFn);
  }

  /**
   * Create an effect that reacts to selected state changes
   * @param name Unique effect name
   * @param selector State selector
   * @param effectFn Effect function that receives selected value
   */
  createSelectorEffect<K>(
    name: string,
    selector: NgSimpleStateSelectState<S, K>,
    effectFn: (selected: K) => void,
  ): void {
    this.createEffectFromObservable(name, this.selectState(selector), effectFn);
  }

  /**
   * Return the current store state (snapshot)
   * @returns The current state
   */
  getCurrentState(): Readonly<S> {
    return this._devMode ? this._deepFreeze(this.state$.getValue()) : this.state$.getValue();
  }

  /**
   * Set a new state (patch)
   * @param newState New state
   * @param actionName The action label into Redux DevTools (default is parent function name)
   * @returns True if the state is changed
   */
  setState(newState: Partial<S>, actionName?: string): boolean;
  /**
   * Set a new state (patch)
   * @param selectFn State reducer
   * @param actionName The action label into Redux DevTools (default is parent function name)
   * @returns True if the state is changed
   */
  setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean;
  setState(stateFnOrNewState: StateFnOrNewState<S>, actionName?: string): boolean {
    const state = this._setState(stateFnOrNewState, actionName);
    if (state !== undefined) {
      this.state$.next(state);
      this._afterCommit();
      return true;
    }
    return false;
  }

  /**
   * Replace state (full replace)
   * @param newState New state
   * @param actionName The action label into Redux DevTools (default is parent function name)
   * @returns True if the state is changed
   */
  replaceState(newState: S, actionName?: string): boolean;
  /**
   * Replace state (full replace)
   * @param selectFn State reducer
   * @param actionName The action label into Redux DevTools (default is parent function name)
   * @returns True if the state is changed
   */
  replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): boolean;
  replaceState(stateFnOrNewState: StateFnOrReplaceState<S>, actionName?: string): boolean {
    const state = this._replaceState(stateFnOrNewState, actionName);
    if (state !== undefined) {
      this.state$.next(state);
      this._afterCommit();
      return true;
    }
    return false;
  }
}
