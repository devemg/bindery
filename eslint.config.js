import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'docs/design-handoff'] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: false },
      ],
    },
  },

  /*
   * Architecture boundary: `src/lib` is the framework-agnostic engine. It may
   * not reach into the React feature layer, and it may not import React. Held
   * by the linter, not by convention.
   */
  {
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/lib must stay framework-agnostic.' },
            { name: 'react-dom', message: 'src/lib must stay framework-agnostic.' },
          ],
          patterns: [
            {
              group: ['**/features/**', '**/app/**'],
              message: 'src/lib must not depend on the UI layer.',
            },
          ],
        },
      ],
    },
  },

  /* Tests get a little more rope: fixtures and mocks are not production code. */
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-restricted-imports': 'off',
    },
  },

  {
    files: ['*.config.{ts,js}', 'e2e/**', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
