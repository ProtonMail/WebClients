module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'no-console': 'off',
        curly: ['error', 'multi-line'],
    },
    ignorePatterns: ['.eslintrc.js'],
};
