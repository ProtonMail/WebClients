module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        '@typescript-eslint/consistent-type-imports': 'error',
        curly: ['error', 'multi-line'],
    },
    ignorePatterns: ['.eslintrc.js', 'fathom/'],
};
