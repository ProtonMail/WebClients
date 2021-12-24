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
    ignorePatterns: ['.eslintrc.js'],
};
