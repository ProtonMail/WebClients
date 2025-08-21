module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
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
    overrides: [
        {
            files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
            extends: ['plugin:testing-library/react'],
            rules: {
                'testing-library/no-node-access': 'warn',
                'testing-library/no-unnecessary-act': 'warn',
                'testing-library/prefer-screen-queries': 'warn',
                'testing-library/prefer-find-by': 'warn',
                'testing-library/prefer-presence-queries': 'warn',
                'testing-library/render-result-naming-convention': 'warn',
                'testing-library/no-container': 'warn',
            },
        },
    ],
};
