module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
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
