import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['lib/Generated/**'],
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/drive-store*'],
                message:
                    'docs-shared should not import from drive-store. Use docs-shared/lib/CryptoTypes or docs-shared/lib/BasicTypes instead.',
            },
        ],
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                'no-unused-vars': 'off',
                'no-use-before-define': 'off',
                'proton/naming-convention': 'off',
                'no-console': ['warn', { allow: ['warn', 'error', 'trace'] }],
            },
        },
    ],
});
