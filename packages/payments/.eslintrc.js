module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'import/no-internal-modules': [
            'error',
            {
                forbid: ['@proton/payments', '@proton/payments/**'],
            },
        ],
    },
    ignorePatterns: ['.eslintrc.js'],
};
