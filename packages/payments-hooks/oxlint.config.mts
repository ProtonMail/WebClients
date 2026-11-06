import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    restrictedImports: {
        // @proton/components and @proton/payments-ui depend on this package.
        patterns: [
            {
                group: ['@proton/components', '@proton/components/*', '@proton/payments-ui', '@proton/payments-ui/*'],
                message:
                    'Keep @proton/payments-hooks free of rendered UI; move the code to @proton/payments-ui instead.',
            },
        ],
    },
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
