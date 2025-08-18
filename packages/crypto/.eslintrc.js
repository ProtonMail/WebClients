module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    plugins: ['chai-friendly', 'jasmine'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'chai-friendly/no-unused-expressions': ['error', { allowShortCircuit: true }],
        'no-restricted-imports': 'off', // currently only used to guard against `pmcrypto` imports
        'jasmine/no-focused-tests': 'error',
    },
};
