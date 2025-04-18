const isFixMode = process.argv.includes('--fix')
module.exports = {
  extends: ['@proton/eslint-config-proton'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  rules: {
    'react/prop-types': 'off',
    ...(!isFixMode && {
      'react-hooks/exhaustive-deps': 'warn',
    }),
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'monorepo-cop/no-disable-monorepo-no-relative-rule': 'off',
    'monorepo-cop/no-relative-import-outside-package': 'warn',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'trace'],
      },
    ],
    'max-classes-per-file': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false,
      },
    ],
  },
  overrides: [
    {
      files: ['*.test.ts'],
      rules: {
        'max-classes-per-file': 'off',
        'class-methods-use-this': 'off',
      },
    },
  ],
  ignorePatterns: ['.eslintrc.js'],
}
