import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { StoreOptions } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('store schematic', () => {

  let runner: SchematicTestRunner;

  beforeEach(() => {
    runner = new SchematicTestRunner('ng-simple-state', collectionPath);
  });

  // --- Signal Store ---

  describe('signal store (default)', () => {
    let tree: UnitTestTree;

    beforeEach(async () => {
      tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
      });
    });

    it('should generate store and spec files in a folder', () => {
      const files = tree.files;
      expect(files).toContain('/src/app/my-feature/my-feature.store.ts');
      expect(files).toContain('/src/app/my-feature/my-feature.store.spec.ts');
    });

    it('should generate a Signal store that extends NgSimpleStateBaseSignalStore', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('NgSimpleStateBaseSignalStore');
      expect(content).not.toContain('NgSimpleStateBaseRxjsStore');
    });

    it('should use classify for class name', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('export class MyFeatureStore');
      expect(content).toContain('export interface MyFeatureState');
    });

    it('should set storeName to classified name + Store', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain("storeName: 'MyFeatureStore'");
    });

    it('should import Signal from @angular/core', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('import { Signal }');
    });

    it('should have Signal-based selectors', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('selectLoading(): Signal<boolean>');
      expect(content).toContain('selectError(): Signal<string | null>');
    });

    it('should generate spec with Signal selectors', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.spec.ts');
      expect(content).toContain('selectLoading()()');
      expect(content).not.toContain('subscribe');
    });
  });

  // --- RxJS Store ---

  describe('rxjs store', () => {
    let tree: UnitTestTree;

    beforeEach(async () => {
      tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'rxjs',
        path: 'src/app',
      });
    });

    it('should generate store and spec files', () => {
      const files = tree.files;
      expect(files).toContain('/src/app/my-feature/my-feature.store.ts');
      expect(files).toContain('/src/app/my-feature/my-feature.store.spec.ts');
    });

    it('should generate an RxJS store that extends NgSimpleStateBaseRxjsStore', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('NgSimpleStateBaseRxjsStore');
      expect(content).not.toContain('NgSimpleStateBaseSignalStore');
    });

    it('should import Observable from rxjs', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain("import { Observable } from 'rxjs'");
    });

    it('should have Observable-based selectors', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('selectLoading(): Observable<boolean>');
      expect(content).toContain('selectError(): Observable<string | null>');
    });

    it('should generate spec with RxJS selectors (subscribe)', () => {
      const content = tree.readContent('/src/app/my-feature/my-feature.store.spec.ts');
      expect(content).toContain('subscribe');
      expect(content).not.toContain('selectLoading()()');
    });
  });

  // --- Options: flat ---

  describe('flat option', () => {
    it('should create files at the given path without a subfolder', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        flat: true,
      });

      const files = tree.files;
      expect(files).toContain('/src/app/my-feature.store.ts');
      expect(files).toContain('/src/app/my-feature.store.spec.ts');
      // Should NOT be in a subfolder
      expect(files).not.toContain('/src/app/my-feature/my-feature.store.ts');
    });
  });

  // --- Options: skipTests ---

  describe('skipTests option', () => {
    it('should still generate spec file (skipTests not fully wired)', async () => {
      // NOTE: The current implementation has `skipTests ? noop() : noop()` which
      // does nothing. This test documents the current behavior.
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        skipTests: true,
      });

      // Currently spec is always generated (noop branch is identical)
      expect(tree.files).toContain('/src/app/my-feature/my-feature.store.spec.ts');
    });
  });

  // --- Options: persistentStorage ---

  describe('persistentStorage option', () => {
    it('should add persistentStorage config when set to local', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        persistentStorage: 'local',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain("persistentStorage: 'local'");
    });

    it('should add persistentStorage config when set to session', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        persistentStorage: 'session',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain("persistentStorage: 'session'");
    });

    it('should not add persistentStorage when set to none', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        persistentStorage: 'none',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).not.toContain('persistentStorage');
    });
  });

  // --- Options: enableDevTool ---

  describe('enableDevTool option', () => {
    it('should add enableDevTool when true', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        enableDevTool: true,
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('enableDevTool: true');
    });

    it('should not add enableDevTool when false', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
        enableDevTool: false,
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).not.toContain('enableDevTool');
    });
  });

  // --- Name variations ---

  describe('name handling', () => {
    it('should dasherize the name for file path', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'myFeatureStore',
        type: 'signal',
        path: 'src/app',
      });

      expect(tree.files).toContain('/src/app/my-feature-store/my-feature-store.store.ts');
    });

    it('should classify the name for the class', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'user-profile',
        type: 'signal',
        path: 'src/app',
      });

      const content = tree.readContent('/src/app/user-profile/user-profile.store.ts');
      expect(content).toContain('export class UserProfileStore');
      expect(content).toContain('export interface UserProfileState');
    });

    it('should handle single word names', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'counter',
        type: 'signal',
        path: 'src/app',
      });

      expect(tree.files).toContain('/src/app/counter/counter.store.ts');
      const content = tree.readContent('/src/app/counter/counter.store.ts');
      expect(content).toContain('export class CounterStore');
    });
  });

  // --- No path ---

  describe('without path option', () => {
    it('should create files at root when path is empty', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
      });

      expect(tree.files).toContain('/my-feature/my-feature.store.ts');
      expect(tree.files).toContain('/my-feature/my-feature.store.spec.ts');
    });
  });

  // --- Store content structure ---

  describe('generated store content', () => {
    it('should have proper initial state structure', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('loading: false');
      expect(content).toContain('error: null');
    });

    it('should have setLoading, setError, clearError actions', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('setLoading(loading: boolean)');
      expect(content).toContain('setError(error: string | null)');
      expect(content).toContain('clearError()');
    });

    it('should have @Injectable() decorator', async () => {
      const tree = await runner.runSchematic<StoreOptions>('store', {
        name: 'my-feature',
        type: 'signal',
        path: 'src/app',
      });

      const content = tree.readContent('/src/app/my-feature/my-feature.store.ts');
      expect(content).toContain('@Injectable()');
    });
  });
});
