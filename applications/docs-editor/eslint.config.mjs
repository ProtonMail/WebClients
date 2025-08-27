import { defineConfig } from 'eslint/config'
import defaultConfig from '@proton/eslint-config-proton/all'

const isFixMode = process.argv.includes('--fix')

export default defineConfig([
  defaultConfig,
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
    },
  },
  {
    files: ['**/*.test.ts'],

    rules: {
      'max-classes-per-file': 'off',
      'class-methods-use-this': 'off',
    },
  },
])
