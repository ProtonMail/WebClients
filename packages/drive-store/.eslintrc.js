const isFixMode = process.argv.includes('--fix');
module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    rules: {
        'react/prop-types': 'off',
        ...(!isFixMode && {
            'react-hooks/exhaustive-deps': 'warn',
        }),
        'no-console': [
            'error',
            {
                allow: ['warn', 'error'],
            },
        ],
        'max-classes-per-file': 'off',
        '@typescript-eslint/consistent-type-imports': 'warn',
        '@typescript-eslint/no-use-before-define': [
            'error',
            {
                functions: false,
                classes: false,
            },
        ],
    },
    overrides: [
        {
            files: ['*.test.ts'],
            rules: {
                'max-classes-per-file': 'off',
                'class-methods-use-this': 'off',
            },
        },
    ],
    ignorePatterns: ['.eslintrc.js', 'assets/sandbox.js', 'scripts'],
};
