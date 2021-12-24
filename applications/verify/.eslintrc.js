module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'no-console': [
            'error',
            {
                allow: ['warn', 'error'],
            },
        ],
    },
    ignorePatterns: ['.eslintrc.js'],
};
