/**
 * Build the schematics into the distributable package.
 *
 * `ng-packagr` only bundles the library source, so without this step the
 * `schematics` entry declared in package.json points at a collection that is not
 * shipped and `ng add` / `ng generate ng-simple-state:store` fail for consumers.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const schematicsDir = dirname(fileURLToPath(import.meta.url));
const outDir = join(schematicsDir, '../../../dist/ng-simple-state/schematics');

if (!existsSync(join(schematicsDir, '../../../dist/ng-simple-state'))) {
    console.error('dist/ng-simple-state not found: run "npm run build:lib" first.');
    process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });

console.log('Compiling schematics...');
execFileSync(
    process.execPath,
    [
        join(schematicsDir, '../../../node_modules/typescript/lib/tsc.js'),
        '-p',
        join(schematicsDir, 'tsconfig.schematics.build.json')
    ],
    { stdio: 'inherit' }
);

console.log('Copying schematics assets...');
mkdirSync(outDir, { recursive: true });
cpSync(join(schematicsDir, 'collection.json'), join(outDir, 'collection.json'));
cpSync(join(schematicsDir, 'store/schema.json'), join(outDir, 'store/schema.json'));
cpSync(join(schematicsDir, 'store/files'), join(outDir, 'store/files'), { recursive: true });

// the published package is `"type": "module"`, but schematics are CommonJS:
// this manifest scopes the module system to this folder only
writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');

console.log('Schematics built into', outDir);
