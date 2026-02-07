import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function ngAdd(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Adding ng-simple-state to your project...');
    
    // Add install task
    context.addTask(new NodePackageInstallTask());
    
    context.logger.info(`
✅ ng-simple-state has been installed!

Next steps:
1. Import provideNgSimpleState in your app config:

   import { provideNgSimpleState } from 'ng-simple-state';
   
   export const appConfig = {
     providers: [
       ...provideNgSimpleState({
         enableDevTool: isDevMode()
       })
     ]
   };

2. Generate a new store:

   ng generate ng-simple-state:store my-feature

3. Inject the store in your component:

   @Component({...})
   export class MyComponent {
     private readonly store = inject(MyFeatureStore);
   }

For more information, visit: https://github.com/nigrosimone/ng-simple-state
    `);
    
    return tree;
  };
}
