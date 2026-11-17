import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    // Only `src` is linted, like the ESLint config before.
    ignorePatterns: ['/*', '!/src', '!/oxlint.config.mts'],
    overrides: [
        refObjectNullOverride,
        {
            files: allGlobs,
            rules: {
                'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                curly: ['error', 'multi-line'],
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
    ],
});
