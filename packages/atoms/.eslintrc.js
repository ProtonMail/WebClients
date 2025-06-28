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
    rules: {
        'import/no-internal-modules': [
            'error',
            {
                forbid: ['@proton/atoms', '@proton/atoms'],
            },
        ],
    },
    ignorePatterns: ['.eslintrc.js', 'storybook-static/*'],
};
