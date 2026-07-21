/**
 * Copy the non TypeScript files the schematics need at runtime.
 *
 * `tsc` only emits JavaScript, so the collection manifest, the option schema and
 * the file templates have to be placed next to the compiled output by hand —
 * without them the collection cannot even be loaded.
 *
 * Used both by the test run and by the distributable build, so the two cannot
 * drift apart.
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const schematicsDir = dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} outDir directory holding the compiled schematics
 */
export function copySchematicsAssets(outDir) {
    mkdirSync(join(outDir, 'store'), { recursive: true });
    cpSync(join(schematicsDir, 'collection.json'), join(outDir, 'collection.json'));
    cpSync(join(schematicsDir, 'store/schema.json'), join(outDir, 'store/schema.json'));
    cpSync(join(schematicsDir, 'store/files'), join(outDir, 'store/files'), { recursive: true });
}

// also usable straight from an npm script: `node copy-assets.mjs <outDir>`
const outDirArgument = process.argv[2];
if (outDirArgument) {
    copySchematicsAssets(resolve(outDirArgument));
    console.log('Schematics assets copied into', outDirArgument);
}
