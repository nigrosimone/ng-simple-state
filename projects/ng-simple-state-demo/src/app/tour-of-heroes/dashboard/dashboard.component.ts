import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';
import { HeroSearchComponent } from '../hero-search/hero-search.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  /* eslint-disable-next-line @angular-eslint/component-selector */
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [HeroSearchComponent, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly heroService = inject(HeroService);
  public readonly heroes$: Observable<Hero[]> = this.heroService.getHeroes();
}
