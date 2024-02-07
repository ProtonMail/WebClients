module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    ignorePatterns: ['.eslintrc.js', 'vite.config.ts'],
    rules: {
        'no-restricted-syntax': [
            'error',
            {
                selector: 'Literal[value=/localhost/]',
                message: "Usage of 'localhost' string is not allowed.",
            },
        ],
    },
};
