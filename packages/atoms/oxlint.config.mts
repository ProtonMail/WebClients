import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

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
        refObjectNullOverride,
        {
            // create-atom is a dev-only CLI, so its tools (commander, mustache) are dev dependencies.
            files: ['create-atom/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/create-atom/**'],
                }),
            },
        },
    ],
});
