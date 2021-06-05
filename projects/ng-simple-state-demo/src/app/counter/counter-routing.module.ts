import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CounterComponent } from './counter.component';

const routes: Routes = [
    { path: '', component: CounterComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CounterRoutingModule { }
