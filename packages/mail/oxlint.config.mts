import { createOxlintConfig } from '@proton/oxlint-config';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    overrides: [
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
