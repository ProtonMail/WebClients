import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react/exhaustive-deps': 'warn',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
        {
            // Mocks @proton/components modules without a manifest dep (cycle constraint).
            files: ['testing/setup/**'],
            rules: {
                'proton/no-extraneous-dependencies': 'off',
            },
        },
        {
            files: ['testing/**'],
            excludeFiles: ['testing/setup/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                }),
            },
        },
    ],
});
