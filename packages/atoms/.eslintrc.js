module.exports = {
    extends: ['@proton/eslint-config-proton', 'plugin:storybook/recommended'],
    parser: '@typescript-eslint/parser',
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {},
    ignorePatterns: ['.eslintrc.js'],
};
