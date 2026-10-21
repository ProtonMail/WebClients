import { fileURLToPath } from 'node:url';
import { type OxlintOverride, defineConfig } from 'oxlint';

import { brandNameSelectors } from './brandNames.ts';
import { createExtraneousDependenciesRule } from './extraneousDependencies.ts';
import { allGlobs, typescriptGlobs } from './globs.ts';
import { namingConventionOptions } from './namingConvention.ts';
import { type RestrictedImportsOptions, createRestrictedImportRule } from './restrictedImports.ts';

const testGlobs = ['**/*.test.ts', '**/*.test.tsx', '**/__mocks__/**'];
const javaScriptGlobs = ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'];

/**
 * Shared oxlint config without React, equivalent to `@proton/eslint-config-proton/base`. Rules oxlint lacks run
 * from the `proton` plugin in `./plugin` (`proton/*`); compat and the in-house `custom-rules` run as ESLint plugins.
 * Only the listed rules are on: the default `correctness` category is off so the switch from
 * ESLint does not add new findings.
 */
export const base = defineConfig({
    plugins: ['typescript', 'import'],
    jsPlugins: [
        fileURLToPath(new URL('./plugin/index.ts', import.meta.url)),
        'eslint-plugin-custom-rules',
        'eslint-plugin-compat',
    ],
    categories: { correctness: 'off' },
    options: { typeAware: true },
    env: { builtin: true, browser: true },
    settings: {
        // Read by eslint-plugin-compat.
        polyfills: ['es:all', 'ResizeObserver'],
    },
    ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.*/',
        '**/public/assets/**',
        '**/coverage/**',
        '**/__snapshots__/**',
        'eslint.config.mjs',
    ],
    rules: {
        'custom-rules/no-package-self-import': 'error',
        'compat/compat': 'error',
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                curly: ['error', 'all'],
                'no-array-constructor': 'error',
                'no-console': 'warn',
                'no-debugger': 'error',
                'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
                'no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
                'no-fallthrough': 'error',
                'no-loop-func': 'error',
                'no-nested-ternary': 'warn',
                'no-redeclare': 'error',
                'no-restricted-properties': [
                    'error',
                    {
                        object: 'crypto',
                        property: 'subtle',
                        message:
                            'Use helpers from `@protontech/crypto/subtle` instead of accessing the WebCrypto API directly.',
                    },
                ],
                'no-unused-expressions': [
                    'error',
                    { allowShortCircuit: false, allowTernary: false, allowTaggedTemplates: false },
                ],
                'no-unused-vars': [
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
                'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
                'no-useless-constructor': 'error',
                'no-void': ['error', { allowAsStatement: true }],
                'prefer-const': ['error', { ignoreReadBeforeAssign: true, destructuring: 'all' }],

                'typescript/array-type': ['error', { default: 'array' }],
                'typescript/consistent-type-imports': 'error',
                'typescript/dot-notation': ['error', { allowKeywords: true }],
                'typescript/no-floating-promises': 'warn',
                'typescript/no-for-in-array': 'error',
                'typescript/no-implied-eval': 'error',
                'typescript/no-import-type-side-effects': 'error',
                'typescript/no-misused-promises': ['error', { checksVoidReturn: false }],
                'typescript/prefer-enum-initializers': 'error',
                'typescript/return-await': 'error',

                'import/no-cycle': ['error', { ignoreExternal: true }],
                'import/no-named-as-default': 'warn',

                'proton/enforce-uint8array-arraybuffer': 'error',
                'proton/naming-convention': ['error', ...namingConventionOptions],
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule(),
                // Base restrictions only, clients add their own with `createRestrictedImportRule` (restrictedImports.ts)
                'proton/restricted-imports': 'error',
                'proton/restricted-syntax': ['error', ...brandNameSelectors],
            },
        },
        {
            files: javaScriptGlobs,
            rules: {
                // TypeScript resolves these itself in TypeScript files.
                'import/default': 'error',
                'import/namespace': 'error',
                'import/no-named-as-default-member': 'warn',
            },
        },
        {
            files: ['**/*.js'],
            rules: {
                'proton/naming-convention': 'off',
            },
        },
        {
            files: typescriptGlobs,
            rules: {
                'custom-rules/no-boolean-entitlement-composition': 'error',
                'custom-rules/no-single-entitlement-condition': 'error',
            },
        },
        {
            files: testGlobs,
            rules: {
                'compat/compat': 'off',
            },
        },
    ],
});

/** `base` plus the React, jsx-a11y and UI rules, equivalent to `@proton/eslint-config-proton/all`. */
export const all = defineConfig({
    ...base,
    plugins: [...(base.plugins ?? []), 'react', 'jsx-a11y'],
    rules: {
        ...base.rules,
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-ambiguous-text': 'warn',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'warn',
        'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/autocomplete-valid': 'error',
        'jsx-a11y/click-events-have-key-events': 'warn',
        // ESLint's config also had `includeRoles: ['alert', 'dialog']`, which oxlint does not support.
        'jsx-a11y/control-has-associated-label': [
            'warn',
            {
                ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
                ignoreRoles: [
                    'grid',
                    'listbox',
                    'menu',
                    'menubar',
                    'radiogroup',
                    'row',
                    'tablist',
                    'toolbar',
                    'tree',
                    'treegrid',
                ],
            },
        ],
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/interactive-supports-focus': [
            'warn',
            { tabbable: ['button', 'checkbox', 'link', 'searchbox', 'spinbutton', 'switch', 'textbox'] },
        ],
        'jsx-a11y/label-has-associated-control': 'warn',
        'jsx-a11y/media-has-caption': 'warn',
        'jsx-a11y/mouse-events-have-key-events': 'warn',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/no-aria-hidden-on-focusable': 'warn',
        'jsx-a11y/no-distracting-elements': 'error',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': [
            'warn',
            { tr: ['none', 'presentation'], canvas: ['img'] },
        ],
        'jsx-a11y/no-noninteractive-element-interactions': [
            'warn',
            {
                handlers: [
                    'onClick',
                    'onError',
                    'onLoad',
                    'onMouseDown',
                    'onMouseUp',
                    'onKeyPress',
                    'onKeyDown',
                    'onKeyUp',
                ],
                alert: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
                body: ['onError', 'onLoad'],
                dialog: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
                iframe: ['onError', 'onLoad'],
                img: ['onError', 'onLoad'],
            },
        ],
        'jsx-a11y/no-noninteractive-element-to-interactive-role': [
            'error',
            {
                ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
                ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
                li: ['menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'row', 'tab', 'treeitem'],
                table: ['grid'],
                td: ['gridcell'],
                fieldset: ['radiogroup', 'presentation'],
            },
        ],
        'jsx-a11y/no-noninteractive-tabindex': ['warn', { tags: [], roles: ['tabpanel'], allowExpressionValues: true }],
        'jsx-a11y/no-redundant-roles': 'error',
        'jsx-a11y/no-static-element-interactions': [
            'warn',
            {
                allowExpressionValues: true,
                handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
            },
        ],
        'jsx-a11y/prefer-tag-over-role': 'warn',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        'jsx-a11y/scope': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',

        'react/display-name': 'warn',
        'react/forbid-component-props': [
            'warn',
            { forbid: [{ propName: 'data-test-id', message: 'Please use `data-testid` instead' }] },
        ],
        'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx', '.tsx'] }],
        'react/no-unknown-property': 'error',
        'react/rules-of-hooks': 'error',

        'custom-rules/date-formatting-locale': 'warn',
        'custom-rules/deprecate-classes': 'warn',
        'custom-rules/deprecate-responsive-utility-classes': 'warn',
        'custom-rules/deprecate-sizing-classes': 'warn',
        'custom-rules/deprecate-spacing-utility-classes': 'warn',
        'custom-rules/no-template-in-translator-context': 'error',
        'custom-rules/use-subscription-modal-loading': 'warn',
        'custom-rules/validate-ttag': 'error',
        'custom-rules/validate-ttag-key': 'error',
        'custom-rules/validate-ttag-key-autofix-warning': 'warn',
    },
});

const presets = { base, all };

export interface WorkspaceConfigOptions {
    /** `all` adds React, jsx-a11y and the UI rules to `base`, like the ESLint presets of the same names. */
    preset?: keyof typeof presets;
    /** Rollout ids and client additions for `proton/restricted-imports`, as in `createRestrictedImportRule`. */
    restrictedImports?: RestrictedImportsOptions;
    ignorePatterns?: string[];
    overrides?: OxlintOverride[];
}

/**
 * Builds a workspace's `oxlint.config.mts` on top of a shared preset. Use it instead of `extends`:
 * oxlint's `extends` drops the extended config's `ignorePatterns`, `env` and `settings` (oxlint 1.87), so this
 * copies them over.
 *
 * @example
 * export default createOxlintConfig({ restrictedImports: { rollout: ['account-barrel'] } });
 */
export function createOxlintConfig({
    preset = 'all',
    restrictedImports,
    ignorePatterns = [],
    overrides = [],
}: WorkspaceConfigOptions = {}) {
    const restrictedImportsOverrides: OxlintOverride[] = restrictedImports
        ? [{ files: allGlobs, rules: { 'proton/restricted-imports': createRestrictedImportRule(restrictedImports) } }]
        : [];

    const shared = presets[preset];

    return defineConfig({
        extends: [shared],
        ignorePatterns: [...(shared.ignorePatterns ?? []), ...ignorePatterns],
        env: shared.env,
        settings: shared.settings,
        overrides: [...restrictedImportsOverrides, ...overrides],
    });
}
