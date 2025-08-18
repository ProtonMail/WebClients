module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        curly: ['error', 'multi-line'],
    },
    ignorePatterns: ['.eslintrc.js'],
};
