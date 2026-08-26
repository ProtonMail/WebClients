import { defineConfig } from 'eslint/config'
import { atomsPackage, componentsPackage, createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel'
import defaultConfig from '@proton/eslint-config-proton/all'

const isFixMode = process.argv.includes('--fix')

export default defineConfig([
  defaultConfig,
  createBarrelConfig({ packages: [atomsPackage, iconsPackage, componentsPackage] }),
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
      // TODO: Add the missing explicit deps and remove this rule
      'import/no-extraneous-dependencies': 'off',
      // TODO: Remove this rule once the compat issue is resolved
      'compat/compat': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@proton/drive-store*'],
              message:
                'docs-editor should not import from drive-store. Use @proton/docs-shared or @proton/docs-core instead.',
            },
          ],
        },
      ],
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
