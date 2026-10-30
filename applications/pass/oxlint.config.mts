import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: ['../*', './../*'],
                message: 'Use the proton-pass-web/* alias instead of walking up directories.',
            },
        ],
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                'no-console': ['error', { allow: ['warn', 'error'] }],
                curly: ['error', 'multi-line'],
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
    ],
});
