import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    { path: 'todo', loadChildren: () => import('./todo/todo.module').then(m => m.TodoModule) },
    { path: 'counter', loadChildren: () => import('./counter/counter.module').then(m => m.CounterModule) }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
