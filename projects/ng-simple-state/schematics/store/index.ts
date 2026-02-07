import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url,
  strings,
  noop
} from '@angular-devkit/schematics';
import { normalize, Path } from '@angular-devkit/core';

export interface StoreOptions {
  name: string;
  path?: string;
  project?: string;
  type: 'signal' | 'rxjs';
  flat?: boolean;
  skipTests?: boolean;
  prefix?: string;
  persistentStorage?: 'none' | 'local' | 'session';
  enableDevTool?: boolean;
}

function buildPath(options: StoreOptions): string {
  let path = options.path || '';
  if (!options.flat) {
    path = `${path}/${strings.dasherize(options.name)}`;
  }
  return normalize(path as Path);
}

export function store(options: StoreOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = buildPath(options);
    
    const templateSource = apply(url('./files'), [
      options.skipTests ? noop() : noop(),
      applyTemplates({
        ...strings,
        ...options,
        name: options.name,
        classify: strings.classify,
        dasherize: strings.dasherize,
        camelize: strings.camelize,
        isSignal: options.type === 'signal',
        isRxjs: options.type === 'rxjs',
        hasPersistentStorage: options.persistentStorage && options.persistentStorage !== 'none',
        persistentStorageValue: options.persistentStorage === 'none' ? undefined : options.persistentStorage
      }),
      move(path)
    ]);

    return chain([
      mergeWith(templateSource)
    ])(tree, context);
  };
}
