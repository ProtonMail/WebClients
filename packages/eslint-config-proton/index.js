const path = require('path');

module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        jest: true,
        node: true,
    },
    extends: ['prettier', 'plugin:monorepo-cop/recommended', 'plugin:jsx-a11y/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
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
        '@protontech/enforce-uint8array-arraybuffer',
    ],
    rules: {
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array',
            },
        ],
        '@typescript-eslint/default-param-last': 'off',
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

        /* Copied from deprecated eslint-config-airbnb-base */
        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],

        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'error',

        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': [
            'error',
            {
                allow: ['arrowFunctions', 'functions', 'methods'],
            },
        ],

        'no-implied-eval': 'off',
        'no-new-func': 'off',
        '@typescript-eslint/no-implied-eval': 'error',

        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': 'error',

        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': [
            'off',
            {
                ignore: [],
                ignoreArrayIndexes: true,
                enforceConst: true,
                detectObjects: false,
            },
        ],

        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'off',

        'no-throw-literal': 'off',
        '@typescript-eslint/only-throw-error': 'off',

        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': [
            'error',
            {
                allowShortCircuit: false,
                allowTernary: false,
                allowTaggedTemplates: false,
            },
        ],

        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                args: 'after-used',
                argsIgnorePattern: '^_',
                caughtErrors: 'none',
                destructuredArrayIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true,
            },
        ],

        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error', { functions: true, classes: true, variables: true }],

        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',

        'require-await': 'off',
        '@typescript-eslint/require-await': 'off',

        'no-return-await': 'off',
        '@typescript-eslint/return-await': 'error',

        '@typescript-eslint/consistent-type-imports': 'error',

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
                paths: [
                    {
                        name: 'reselect',
                        importNames: ['createSelector'],
                        message: 'Please use createSelector from @redux/toolkit instead.',
                    },
                ],
                patterns: [
                    {
                        group: ['pmcrypto'],
                        message:
                            'You should probably import from `@proton/crypto` instead: using `pmcrypto` directly is only needed for crypto-specific use cases.',
                    },
                    {
                        group: ['@proton/payments/index'],
                        message: 'You should import from `@proton/payments` instead.',
                    },
                    {
                        group: ['@proton/payments/core/*'],
                        message: 'You should import from `@proton/payments` instead.',
                    },
                    {
                        group: ['@proton/payments/ui/*'],
                        message: 'You should import from `@proton/payments/ui` instead.',
                    },
                    {
                        group: ['@proton/atoms/*'],
                        message: 'You should import from `@proton/atoms` instead.',
                    },
                    {
                        group: ['@proton/components/index'],
                        message: 'You should import from `@proton/components` instead.',
                    },
                ],
            },
        ],
        'no-restricted-syntax': [
            'error',
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton\\b(?!\\s+(Account|Mail|Drive|Calendar|VPN|Verify|Sentinel))/i]',
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
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\Dark Web Monitoring\\b/i]',
                message: 'Use `DARK_WEB_MONITORING_NAME` instead to avoid possible translation.',
            },
            {
                selector:
                    'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\Proton Sentinel\\b/i]',
                message: 'Use `PROTON_SENTINEL_NAME` instead to avoid possible translation.',
            },
            {
                selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\Lumo\\b/i]',
                message: 'Use `LUMO_SHORT_APP_NAME` instead to avoid possible translation.',
            },
        ],
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
        'custom-rules/validate-ttag': 'error',
        'custom-rules/date-formatting-locale': 'warn',
        'lodash/import-scope': [2, 'method'],
        '@protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer': 'error',
    },
    settings: {
        'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
        'import/resolver': {
            // The built-in node resolver does not support the `exports` entrypoints.
            // The TS one is used as a workaround, see https://github.com/import-js/eslint-plugin-import/issues/1810#issuecomment-1189510672
            typescript: {},
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
            },

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
