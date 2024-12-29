import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  model,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.css'],
  imports: [CommonModule, FormsModule],
  providers: [HeroService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailComponent implements OnInit {
  hero = signal<Hero | undefined>(undefined);
  name = model<string>('');

  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private location: Location
  ) {}

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
