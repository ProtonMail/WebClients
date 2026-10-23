import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    overrides: [
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
