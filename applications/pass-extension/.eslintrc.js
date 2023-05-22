module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'no-console': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        curly: ['error', 'multi-line'],
    },
    ignorePatterns: ['.eslintrc.js'],
};
