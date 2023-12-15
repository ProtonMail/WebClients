module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    plugins: ['jasmine'],
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
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
