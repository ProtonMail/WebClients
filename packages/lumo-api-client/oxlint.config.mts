import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            rules: {
                'no-console': 'off',
                curly: ['error', 'multi-line'],
                'no-unused-vars': [
                    'warn',
                    {
                        vars: 'all',
                        args: 'after-used',
                        ignoreRestSiblings: true,
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_',
                    },
                ],
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
    ],
});
