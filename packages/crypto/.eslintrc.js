module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    env: {
        mocha: true,
    },
    plugins: ['chai-friendly', 'jasmine'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
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
