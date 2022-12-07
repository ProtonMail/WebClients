module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'react/button-has-type': ['warn'],
        'react/forbid-prop-types': ['warn'],
        'react/no-array-index-key': ['warn'],
    },
    ignorePatterns: ['.eslintrc.js'],
};
