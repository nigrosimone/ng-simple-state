import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeroService } from './hero.service';

@Component({
  /* eslint-disable-next-line @angular-eslint/component-selector */
  selector: 'app-root',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.css'],
  imports: [RouterModule, CommonModule],
  providers: [HeroService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourComponent {

}
