import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    ignorePatterns: ['tests/**/*data.js'],
    overrides: [
        {
            // Some tests import packages that depend on @proton/shared, which cannot be declared
            // as dependencies without creating a cycle. See INWEB-1236 Phase 7.
            files: ['tests/**'],
            rules: {
                'proton/no-extraneous-dependencies': 'off',
            },
        },
        {
            files: ['testing/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                }),
            },
        },
    ],
});
