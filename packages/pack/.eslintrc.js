module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'import/no-dynamic-require': 'off',
        'global-require': 'off',
        'no-console': 'off',
    },
    ignorePatterns: ['.eslintrc.js'],
};
