module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    plugins: ['jasmine'],
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'import/no-unresolved': [
            'error',
            {
                ignore: ['design-system'],
            },
        ],
        'jasmine/no-focused-tests': 'error',
    },
    ignorePatterns: ['.eslintrc.js'],
};
