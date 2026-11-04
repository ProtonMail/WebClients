import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

const underscores = { leadingUnderscore: 'allow', trailingUnderscore: 'allow' };

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            rules: {
                'no-console': 'off',
                'no-nested-ternary': 'off',
                curly: ['error', 'multi-line'],
                'no-unused-vars': [
                    'warn',
                    {
                        vars: 'all',
                        args: 'after-used',
                        ignoreRestSiblings: true,
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_',
                        caughtErrors: 'none',
                        destructuredArrayIgnorePattern: '^_',
                    },
                ],
                'proton/naming-convention': [
                    'error',
                    { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], ...underscores },
                    { selector: 'function', format: ['camelCase', 'PascalCase'], ...underscores },
                    { selector: 'typeLike', format: ['PascalCase'], ...underscores },
                    { selector: 'enum', format: ['PascalCase', 'UPPER_CASE'], ...underscores },
                ],
                'no-use-before-define': 'off',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
        {
            // Local development tools (slides eval runners, in-app checks) that never ship. They use
            // packages hoisted in the monorepo (playwright, esbuild, @napi-rs/canvas, @xmldom/xmldom)
            // rather than adding them to Lumo's dependencies.
            files: ['dev/**'],
            rules: {
                'proton/no-extraneous-dependencies': 'off',
            },
        },
    ],
});
