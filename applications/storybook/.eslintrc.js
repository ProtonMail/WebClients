module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton', 'plugin:storybook/recommended'],
    parser: '@typescript-eslint/parser',
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {},
    ignorePatterns: ['.eslintrc.js'],
};
