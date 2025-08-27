//@ts-check
import protontechEnforceUint8ArrayArraybuffer from '@protontech/eslint-plugin-enforce-uint8array-arraybuffer';
import importPlugin from 'eslint-plugin-import';
import lodash from 'eslint-plugin-lodash';
import monorepoCop from 'eslint-plugin-monorepo-cop';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import testingLibrary from 'eslint-plugin-testing-library';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

//import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    {
        name: 'register-all-plugins',
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            import: importPlugin,
            // @ts-expect-error -- Temporary types incompatibility pending flat config support
            'monorepo-cop': monorepoCop,
            'no-only-tests': noOnlyTests,
            lodash,
            '@protontech/enforce-uint8array-arraybuffer': protontechEnforceUint8ArrayArraybuffer,
            testingLibrary,
        },
    },

    { name: 'monorepo', rules: monorepoCop.configs.recommended.rules },

    // Unfortunately we are not using prettier recommended
    //eslintPluginPrettierRecommended,

    // Unfortunately we are not using the recommended config for eslint
    // TODO: Migrate everything to support it
    //{ name: `${eslint.meta.name}/recommended`, ...eslint.configs.recommended },

    // base config
    {
        name: 'base-config',
        files: [
            /* JS also needed so that we can lint JS files in the monorepo*/
            '**/*.js',
            '**/*.mjs',
            '**/*.jsx',
            '**/*.ts',
            '**/*.tsx',
            '**/*.mts',
            '**/*.cts',
        ],
        languageOptions: {
            parser: tseslint.parser,
            sourceType: 'module',
            parserOptions: {
                projectService: true, // auto-detect nearest tsconfig
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/array-type': ['error', { default: 'array' }],

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
                { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
                { selector: 'function', format: ['camelCase', 'PascalCase'] },
                { selector: 'typeLike', format: ['PascalCase', 'UPPER_CASE'] },
                { selector: 'enum', format: ['PascalCase', 'UPPER_CASE'] },
            ],

            'dot-notation': 'off',
            '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],

            'no-array-constructor': 'off',
            '@typescript-eslint/no-array-constructor': 'error',

            'no-empty-function': 'off',
            '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],

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

            'prefer-const': ['error', { ignoreReadBeforeAssign: true, destructuring: 'all' }],

            'arrow-body-style': 'off',
            'consistent-return': 'off',
            curly: ['error', 'all'],

            'import/export': 2,
            'import/named': 'off',
            'import/default': 'off',
            'import/namespace': 'off',
            'import/order': 'off',
            'import/no-extraneous-dependencies': 'off',
            'import/no-named-as-default': 'off',
            'import/no-named-as-default-member': 'off',
            'import/no-mutable-exports': 'off',

            'import/no-unresolved': [2, { amd: true, commonjs: true }],

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
                        { group: ['@proton/atoms/*'], message: 'You should import from `@proton/atoms` instead.' },
                        {
                            group: ['@proton/components/index'],
                            message: 'You should import from `@proton/components` instead.',
                        },
                        {
                            group: ['@proton/unleash/index'],
                            message: 'You should import from `@proton/unleash` instead.',
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
                    selector:
                        'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\Lumo\\b/i]',
                    message: 'Use `LUMO_SHORT_APP_NAME` instead to avoid possible translation.',
                },
            ],

            'no-void': [2, { allowAsStatement: true }],

            'lodash/import-scope': [2, 'method'],

            '@protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer': 'error',
        },
        settings: {
            'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],

            'import/resolver': {
                typescript: {},
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
                },
            },

            react: {
                version: 'detect',
            },
        },
    },
    {
        // disable type-aware linting on JS files
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    globalIgnores(['dist', 'public/assets', 'eslint.config.mjs'])
);
