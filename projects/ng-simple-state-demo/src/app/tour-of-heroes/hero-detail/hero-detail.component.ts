import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  model,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';


@Component({
  /* eslint-disable-next-line @angular-eslint/component-selector */
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.css'],
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailComponent implements OnInit {
  private readonly heroService = inject(HeroService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  hero = signal<Hero | undefined>(undefined);
  name = model<string>('');

  ngOnInit(): void {
    this.getHero();
  }

  getHero(): void {
    const id = parseInt(this.route.snapshot.paramMap.get('id')!, 10);
    this.heroService.getHero(id).subscribe((hero) => {
      if (hero) {
        this.hero.set(hero);
        this.name.set(hero.name);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    if (this.hero() && this.name()) {
      this.heroService.updateHero({
        ...(this.hero() as Hero),
        name: this.name(),
      });
      this.goBack();
    }
  }
}
