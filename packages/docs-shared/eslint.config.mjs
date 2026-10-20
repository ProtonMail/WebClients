import { defineConfig, globalIgnores } from 'eslint/config'
import defaultConfig from '@proton/eslint-config-proton/all'
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports'

const isFixMode = process.argv.includes('--fix')

export default defineConfig(
  defaultConfig,
  createRestrictedImportsConfig({
    patterns: [
      {
        group: ['@proton/drive-store*'],
        message:
          'docs-shared should not import from drive-store. Use docs-shared/lib/CryptoTypes or docs-shared/lib/BasicTypes instead.',
      },
    ],
  }),
  {
    rules: {
      'react/prop-types': 'off',
      ...(!isFixMode && {
        'react-hooks/exhaustive-deps': 'warn',
      }),
      // These "import" rules are redundant with TypeScript's errors. Additionally, import aliases
      // (tsconfig "paths") don't work with our eslint config which causes false positives.
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'trace'],
        },
      ],
      'max-classes-per-file': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'max-classes-per-file': 'off',
      'class-methods-use-this': 'off',
    },
  },
  globalIgnores(['dist', 'lib/Generated']),
)
