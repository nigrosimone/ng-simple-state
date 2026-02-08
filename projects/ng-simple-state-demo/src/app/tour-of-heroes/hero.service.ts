import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Hero } from './hero';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig } from 'ng-simple-state';


export type HeroState = Array<Hero>;

const HEROES: HeroState = [
  'Dr. Nice',
  'Bombasto',
  'Celeritas',
  'Magneta',
  'RubberMan',
  'Dynama',
  'Dr. IQ',
  'Magma',
  'Tornado',
].map<Hero>((name, id) => ({ id, name }))

@Injectable()
export class HeroService extends NgSimpleStateBaseRxjsStore<HeroState> {
  storeConfig(): NgSimpleStateStoreConfig<HeroState> {
    return {
      storeName: 'HeroStore'
    };
  }

  initialState(): HeroState {
    return HEROES;
  }

  /** heroes */
  getHeroes(): Observable<Hero[]> {
    return this.selectState();
  }

  /** hero by id */
  getHero(id: number): Observable<Hero | undefined> {
    return this.selectState((state) => state.find((h) => h.id === id));
  }

  /* heroes whose name contains search term */
  searchHeroes(term: string): Observable<Hero[]> {
    return this.selectState((state) =>
      state.filter((h) =>
        h.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  //////// Save methods //////////

  /** add a new hero */
  addHero(name: string) {
    this.setState((state) => ([...state, { name: name, id: state.length }]));
  }

  /** delete the hero */
  deleteHero(id: number) {
    this.setState((state) => (state.filter((h) => h.id !== id)));
  }

  /** update the hero */
  updateHero(hero: Hero) {
    this.setState((state) => {
      const newHeroes = [...state];
      const idx = newHeroes.findIndex((h) => h.id === hero.id);
      if (idx !== -1) {
        newHeroes.splice(idx, 1, hero);
      } else {
        newHeroes.push(hero);
      }
      return newHeroes;
    });
  }
}
