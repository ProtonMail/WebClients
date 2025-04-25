module.exports = {
    extends: ['@proton/eslint-config-proton', 'plugin:storybook/recommended'],
    ignorePatterns: ['.eslintrc.js'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
};
