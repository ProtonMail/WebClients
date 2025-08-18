const isFixMode = process.argv.includes('--fix')
module.exports = {
  root: true,
  extends: ['@proton/eslint-config-proton'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    projectService: true,
  },
  rules: {
    'react/prop-types': 'off',
    ...(!isFixMode && {
      'react-hooks/exhaustive-deps': 'warn',
    }),
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'trace'],
      },
    ],
    'no-fallthrough': 'error',
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
