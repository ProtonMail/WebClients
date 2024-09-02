const path = require('path');

module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        jest: true,
        node: true,
    },
    extends: ['airbnb-typescript', 'prettier', 'plugin:monorepo-cop/recommended', 'plugin:jsx-a11y/recommended'],
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
        'no-only-tests',
        'jsx-a11y',
        'custom-rules',
        'lodash',
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
        // Off since we use @trivago/prettier-plugin-sort-imports
        'import/order': 'off',
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
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['pmcrypto'],
                        message:
                            'You should probably import from `@proton/crypto` instead: using `pmcrypto` directly is only needed for crypto-specific use cases.',
                    },
                ],
            },
        ],
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
        'react/forbid-component-props': [
            'warn',
            {
                forbid: [
                    {
                        propName: 'data-test-id',
                        message: 'Please use `data-testid` instead',
                    },
                ],
            },
        ],
        'es/no-regexp-lookbehind-assertions': 'error',
        'no-only-tests/no-only-tests': 'error',
        /*
         * jsx-a11y
         * set up some as warning only, while waiting real feedback
         * disabled some
         */
        'jsx-a11y/anchor-ambiguous-text': 'warn',
        'jsx-a11y/anchor-is-valid': 'warn',
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/control-has-associated-label': 'warn',
        'jsx-a11y/interactive-supports-focus': 'warn',
        'jsx-a11y/label-has-associated-control': 'warn',
        'jsx-a11y/media-has-caption': 'warn',
        'jsx-a11y/mouse-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': 'warn',
        'jsx-a11y/no-noninteractive-element-interactions': 'warn',
        'jsx-a11y/no-noninteractive-tabindex': 'warn',
        'jsx-a11y/no-aria-hidden-on-focusable': 'warn',
        'jsx-a11y/prefer-tag-over-role': 'warn',
        'jsx-a11y/img-redundant-alt': 'off',
        'jsx-a11y/label-has-for': 'off',
        'jsx-a11y/no-autofocus': 'off',
        'jsx-a11y/no-onchange': 'off',
        'custom-rules/deprecate-spacing-utility-classes': 'warn',
        'custom-rules/deprecate-responsive-utility-classes': 'warn',
        'custom-rules/deprecate-sizing-classes': 'warn',
        'custom-rules/deprecate-classes': 'warn',
        'custom-rules/no-template-in-translator-context': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        'lodash/import-scope': [2, 'method'],
    },
    settings: {
        'import/resolver': {
            // The built-in node resolver does not support the `exports` entrypoints.
            // The TS one is used as a workaround, see https://github.com/import-js/eslint-plugin-import/issues/1810#issuecomment-1189510672
            typescript: {},

            alias: {
                map: [
                    ['proton-mail', path.resolve(__dirname, '../../applications/mail/src/app')],
                    ['tests', path.resolve(__dirname, '../../tests')],
                    ['proton-pass-extension', path.resolve(__dirname, '../../applications/pass-extension/src')],
                    ['proton-pass-web', path.resolve(__dirname, '../../applications/pass/src')],
                ],
                extensions: ['.ts', '.tsx'],
            },
        },
        react: {
            version: 'detect',
        },
    },
};
