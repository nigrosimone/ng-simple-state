// eslint.config.mjs

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    // `examples/` holds standalone apps with their own package.json and tsconfig:
    // they are built on their own, not by this workspace.
    ignores: ['examples/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },
  // Must stay last: turns off every rule that conflicts with Prettier.
  prettier,
);
