import { createExtraneousDependenciesRule, extraneousDependenciesDevDependencies } from '@proton/oxlint-config/extraneousDependencies';
import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

const driveStorePattern = {
    group: ['@proton/drive-store*'],
    message: 'docs-editor should not import from drive-store. Use @proton/docs-shared or @proton/docs-core instead.',
};

export default createOxlintConfig({
    restrictedImports: {
        patterns: [driveStorePattern],
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                'no-unused-vars': 'off',
                'proton/naming-convention': 'off',
                'no-use-before-define': ['error', { functions: false, classes: false }],
                'no-console': ['warn', { allow: ['warn', 'error', 'trace'] }],
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
        {
            files: ['**/TestUtils/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/TestUtils/**'],
                }),
            },
        },
    ],
});
