module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        jest: true,
        node: true,
    },
    extends: ['airbnb-typescript', 'prettier', 'plugin:monorepo-cop/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
    },
    plugins: [
        'react',
        'react-hooks',
        'import',
        '@typescript-eslint',
        'es',
        'monorepo-cop',
        'deprecation',
        'no-only-tests',
    ],
    rules: {
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array',
            },
        ],
        '@typescript-eslint/default-param-last': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/no-redeclare': ['error'],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'variable',
                format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            },
            {
                selector: 'function',
                format: ['camelCase', 'PascalCase'],
            },
            {
                selector: 'typeLike',
                format: ['PascalCase', 'UPPER_CASE'],
            },
            {
                selector: 'enum',
                format: ['PascalCase', 'UPPER_CASE'],
            },
        ],
        'arrow-body-style': 'off',
        'consistent-return': 'off',
        curly: ['error', 'all'],
        'import/export': 2,
        // Provided by TS
        'import/named': 'off',
        'import/default': 'off',
        'import/namespace': 'off',
        'import/order': [
            'error',
            {
                groups: [['builtin', 'external']],
            },
        ],
        'import/no-extraneous-dependencies': 'off',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': [
            2,
            {
                amd: true,
                commonjs: true,
            },
        ],
        'import/prefer-default-export': 'off',
        'no-redeclare': 'off',
        'no-await-in-loop': 'off',
        'no-bitwise': 'off',
        'no-console': 'warn',
        'no-continue': 'off',
        'no-nested-ternary': 'warn',
        'no-param-reassign': 'off',
        'no-plusplus': 'off',
        'no-restricted-syntax': [
            'error',
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton\\b(?!\\s+(Account|Mail|Drive|Calendar|VPN|Verify))/i]',
                message: 'Use `BRAND_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Account\\b/i]',
                message: 'Use `${BRAND_NAME} Account` instead to allow translation of `Account`.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Mail\\b/i]',
                message: 'Use `MAIL_APP_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Drive\\b/i]',
                message: 'Use `DRIVE_APP_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Calendar\\b/i]',
                message: 'Use `CALENDAR_APP_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton VPN\\b/i]',
                message: 'Use `VPN_APP_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Verify\\b/i]',
                message: 'Use `VERIFY_APP_NAME` instead to avoid possible translation.',
            },
        ],
        'no-shadow': 'off',
        'no-void': [2, { allowAsStatement: true }],
        'react-hooks/rules-of-hooks': 'error',
        'react/display-name': 'warn',
        'react/jsx-filename-extension': [
            1,
            {
                extensions: ['.js', '.jsx', '.tsx'],
            },
        ],
        'react/jsx-props-no-spreading': 'off',
        'react/prop-types': 'warn',
        'react/require-default-props': 'off',
        /*
         * next two rules "off" because of the new JSX transform that
         * came with React 17
         */
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        'es/no-regexp-lookbehind-assertions': 'error',
        'deprecation/deprecation': 'warn',
        'no-only-tests/no-only-tests': 'error',
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts', '.tsx'],
            },
        },
        react: {
            version: 'detect',
        },
    },
};
