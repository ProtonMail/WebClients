module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'import/no-dynamic-require': 'off',
        'global-require': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
    },
    ignorePatterns: ['.eslintrc.js'],
};
