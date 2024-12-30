import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Hero } from './hero';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig, stateComparator } from 'projects/ng-simple-state/src/public-api';


export interface HeroState {
  heroes: Array<Hero>;
}

@Injectable({ providedIn: 'root' })
export class HeroService extends NgSimpleStateBaseRxjsStore<HeroState> {
  storeConfig(): NgSimpleStateStoreConfig<HeroState> {
    return {
      storeName: 'HeroStore',
      comparator: stateComparator
    };
  }

  initialState(): HeroState {
    return {
      heroes: [
        { id: 12, name: 'Dr. Nice' },
        { id: 13, name: 'Bombasto' },
        { id: 14, name: 'Celeritas' },
        { id: 15, name: 'Magneta' },
        { id: 16, name: 'RubberMan' },
        { id: 17, name: 'Dynama' },
        { id: 18, name: 'Dr. IQ' },
        { id: 19, name: 'Magma' },
        { id: 20, name: 'Tornado' },
      ],
    };
  }

  /** heroes */
  getHeroes(): Observable<Hero[]> {
    return this.selectState((state) => state.heroes);
  }

  /** hero by id */
  getHero(id: number): Observable<Hero | undefined> {
    return this.selectState((state) => state.heroes.find((h) => h.id === id));
  }

  /* heroes whose name contains search term */
  searchHeroes(term: string): Observable<Hero[]> {
    return this.selectState((state) =>
      state.heroes.filter((h) =>
        h.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  //////// Save methods //////////

  /** add a new hero */
  addHero(name: string) {
    this.setState((state) => ({
      ...state,
      heroes: [...state.heroes, { name: name, id: state.heroes.length }],
    }));
  }

  /** delete the hero */
  deleteHero(id: number) {
    this.setState((state) => ({
      ...state,
      heroes: state.heroes.filter((h) => h.id !== id),
    }));
  }

  /** update the hero */
  updateHero(hero: Hero) {
    this.setState((state) => {
      const newHeroes = [...state.heroes];
      const idx = newHeroes.findIndex((h) => h.id === hero.id);
      if (idx !== -1) {
        newHeroes.splice(idx, 1, hero);
      } else {
        newHeroes.push(hero);
      }
      return {
        ...state,
        heroes: newHeroes,
      };
    });
  }
}
