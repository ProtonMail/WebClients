import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['scripts/**'],
    // drive-store is the legacy Drive fork, so the shared @proton/drive fence is skipped for it and it may import the
    // internal module entry points directly. internal/ stays private.
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/drive/internal', '@proton/drive/internal/*'],
                message: '@proton/drive/internal is private to packages/drive.',
            },
        ],
    },
    overrides: [
        refObjectNullOverride,
        {
            files: allGlobs,
            rules: {
                'no-use-before-define': ['error', { functions: false, classes: false }],
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
    ],
});
