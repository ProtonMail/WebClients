module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'react/forbid-prop-types': 'warn',
        'react/no-array-index-key': 'warn',
    },
    ignorePatterns: ['.eslintrc.js'],
};
