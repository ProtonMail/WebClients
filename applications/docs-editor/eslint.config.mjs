import { defineConfig } from 'eslint/config'
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports'
import defaultConfig from '@proton/eslint-config-proton/all'
import {
  createExtraneousDependenciesRule,
  extraneousDependenciesDevDependencies,
} from '@proton/eslint-config-proton/extraneousDependencies'

const isFixMode = process.argv.includes('--fix')

const hostImports = ['@proton/**', 'ttag']

const sheetsIconsPattern = {
  group: ['@proton/icons', '@proton/icons/**', '@rowsncolumns/icons', '@rowsncolumns/icons/**'],
  message:
    'Use icons from Spreadsheet/components/icons so standalone Sheets does not depend on an external icon registry or package.',
}

const driveStorePattern = {
  group: ['@proton/drive-store*'],
  message: 'docs-editor should not import from drive-store. Use @proton/docs-shared or @proton/docs-core instead.',
}

const testFiles = ['**/*.{test,spec}.{ts,tsx}']

export default defineConfig([
  defaultConfig,
  createRestrictedImportsConfig({
    patterns: [
      driveStorePattern,
      {
        group: ['**/Docs/**', '!**/Docs/public'],
        caseSensitive: true,
        message: 'Import Containers/Docs only through its public.ts, or its testing.ts from tests.',
      },
    ],
  }),
  createRestrictedImportsConfig({
    files: testFiles,
    patterns: [
      driveStorePattern,
      {
        group: ['**/Docs/**', '!**/Docs/public', '!**/Docs/testing'],
        caseSensitive: true,
        message: 'Import Containers/Docs only through its public.ts or testing.ts.',
      },
    ],
  }),
  {
    rules: {
      'react/prop-types': 'off',
      ...(!isFixMode && {
        'react-hooks/exhaustive-deps': 'warn',
      }),
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
        },
      ],
      'monorepo-cop/no-disable-monorepo-no-relative-rule': 'off',
      'monorepo-cop/no-relative-import-outside-package': 'warn',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'trace'],
        },
      ],
      'max-classes-per-file': 'off',
      // TODO: Remove this rule once the compat issue is resolved
      'compat/compat': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'max-classes-per-file': 'off',
      'class-methods-use-this': 'off',
    },
  },
  {
    files: ['**/TestUtils/**'],
    rules: {
      'import/no-extraneous-dependencies': createExtraneousDependenciesRule({
        devDependencies: [...extraneousDependenciesDevDependencies, '**/TestUtils/**'],
      }),
    },
  },
  {
    files: ['src/standalone-sheet/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [sheetsIconsPattern] }],
    },
  },
  {
    files: ['src/app/Containers/Spreadsheet/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            sheetsIconsPattern,
            {
              group: hostImports,
              message:
                'Containers/Spreadsheet is host-independent: get host values from useSheetsDependencies() and strings from useSheetsMessages().',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/Containers/Docs/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@proton/icons', '@proton/icons/**'],
              message:
                'Use Docs/Components/Icon with data from Docs/Components/icons so the Docs editor does not depend on the Proton icon registry.',
            },
            {
              group: hostImports,
              message:
                'Containers/Docs is host-independent: get host values from useDocsDependencies() and strings from useDocsMessages().',
            },
          ],
        },
      ],
    },
  },
])
