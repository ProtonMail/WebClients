import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/components', '@proton/components/*'],
                message: 'atoms must not depend on @proton/components',
            },
        ],
    },
    overrides: [
        {
            // create-atom is a dev-only CLI, so its tools (commander, prettier, mustache) are dev dependencies.
            files: ['create-atom/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/create-atom/**'],
                }),
            },
        },
    ],
});
