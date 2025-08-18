module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'react/button-has-type': ['warn'],
        'react/forbid-prop-types': ['warn'],
        'react/no-array-index-key': ['warn'],
        'import/no-internal-modules': [
            'error',
            {
                forbid: ['@proton/components', '@proton/components'],
            },
        ],
        'import/no-cycle': ['error', { maxDepth: 1 }],
    },
    ignorePatterns: ['.eslintrc.js', 'iwad'],
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
