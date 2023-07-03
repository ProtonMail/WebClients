module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'no-console': 'off',
        'no-nested-ternary': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
    },
    ignorePatterns: ['.eslintrc.js', 'assets/sandbox.js'],
    overrides: [
        {
            files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
            extends: ['plugin:testing-library/react'],
            rules: {
                'testing-library/no-node-access': 'warn',
                'testing-library/no-unnecessary-act': 'warn',
                'testing-library/prefer-screen-queries': 'warn',
                'testing-library/prefer-find-by': 'warn',
                'testing-library/prefer-presence-queries': 'warn',
                'testing-library/render-result-naming-convention': 'warn',
                'testing-library/no-container': 'warn',
            },
        },
    ],
};
