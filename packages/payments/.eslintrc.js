module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'import/no-internal-modules': [
            'error',
            {
                forbid: ['@proton/payments', '@proton/payments/**'],
            },
        ],
        'no-restricted-syntax': [
            'error',
            {
                selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                message:
                    'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
            },
        ],
    },
    ignorePatterns: ['.eslintrc.js'],
};
