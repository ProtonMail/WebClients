module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'no-console': 'off',
        'no-nested-ternary': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'no-restricted-syntax': [
            'error',
            {
                selector: "VariableDeclarator[id.type='ObjectPattern'][init.name='MAILBOX_LABEL_IDS']",
                message: 'Destructuring MAILBOX_LABEL_IDS is not allowed. Use MAILBOX_LABEL_IDS.PROPERTY instead.',
            },
        ],
    },
    ignorePatterns: ['.eslintrc.js', 'assets/sandbox.js'],
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
