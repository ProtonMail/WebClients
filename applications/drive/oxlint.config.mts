import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    // The shared @proton/drive fence is skipped for this app: it owns the drive code, so it may import any folder
    // EXCEPT public/ (the surface for other apps) and internal/ (package-private).
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/drive/public', '@proton/drive/public/*'],
                message:
                    'applications/drive owns the code - import the internal entry points (@proton/drive/modules/*, components/*, ...) directly, not the public wrappers.',
            },
            {
                group: ['@proton/drive/internal', '@proton/drive/internal/*'],
                message: '@proton/drive/internal is private to packages/drive.',
            },
        ],
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                'typescript/no-non-null-assertion': 'warn',
                'no-use-before-define': ['error', { functions: false, classes: false }],
                'no-console': ['warn', { allow: ['warn', 'error'] }],
                'max-classes-per-file': 'off',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
        {
            files: ['**/*.test.ts'],
            rules: {
                'max-classes-per-file': 'off',
                'class-methods-use-this': 'off',
            },
        },
    ],
});
