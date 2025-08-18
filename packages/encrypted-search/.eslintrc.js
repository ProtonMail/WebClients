module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    plugins: ['jasmine'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        'jasmine/no-focused-tests': 'error',
    },
};
