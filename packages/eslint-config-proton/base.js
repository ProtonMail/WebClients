//@ts-check
import protontechEnforceUint8ArrayArraybuffer from '@protontech/eslint-plugin-enforce-uint8array-arraybuffer';
import importPlugin from 'eslint-plugin-import';
import lodash from 'eslint-plugin-lodash';
import monorepoCop from 'eslint-plugin-monorepo-cop';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import testingLibrary from 'eslint-plugin-testing-library';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const typeScriptExtensions = ['.ts', '.cts', '.mts', '.tsx'];
const allExtensions = [...typeScriptExtensions, '.js', '.jsx', '.mjs', '.cjs'];

const typescriptGlobs = typeScriptExtensions.map((ext) => `**/*${ext}`);
const allGlobs = allExtensions.map((ext) => `**/*${ext}`);

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
        files: allGlobs,
        languageOptions: {
            parser: tseslint.parser,
            sourceType: 'module',
            parserOptions: {
                projectService: true, // auto-detect nearest tsconfig
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
    },
    {
        name: 'global-import-rules',
        files: allGlobs,
        rules: {
            'import/no-unresolved': 'error',
            'import/named': 'error',
            'import/namespace': 'error',
            'import/default': 'error',
            'import/export': 'error',

            'import/no-named-as-default': 'warn',
            'import/no-named-as-default-member': 'warn',
            'import/no-duplicates': 'warn',

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
        },
        settings: {
            'import/extensions': allExtensions,
            'import/external-module-folders': ['node_modules', 'node_modules/@types'],
            'import/parsers': {
                '@typescript-eslint/parser': typeScriptExtensions,
            },
            'import/resolver': {
                node: {
                    extensions: allExtensions,
                },
                typescript: true,
            },
        },
    },
    {
        name: 'typescript-import-rules',
        files: typescriptGlobs,
        rules: {
            // TypeScript provides the same checks as part of standard type checking:
            'import/named': 'off',
            'import/namespace': 'off',
            'import/default': 'off',
            'import/order': 'off',
            'import/no-named-as-default-member': 'off',
            'import/no-unresolved': 'off',
        },
    },
    {
        // disable type-aware linting on JS files
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    globalIgnores([
        '.yarn/',
        '**/node_modules/**',
        '**/dist/**',
        '**/.*/',
        '**/public/assets/**',
        '**/coverage/**',
        '**/__snapshots__/**',
        'eslint.config.mjs',
    ])
);
