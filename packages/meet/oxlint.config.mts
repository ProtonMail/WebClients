import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    restrictedImports: {
        paths: [
            {
                name: '@protontech/logger',
                importNames: ['logger'],
                message:
                    'Use meetingLogger from utils/meetingLogger, which prefixes the lines logged in a meeting with its meetingLinkName.',
            },
        ],
    },
    overrides: [
        refObjectNullOverride,
        {
            files: allGlobs,
            rules: {
                'react/exhaustive-deps': 'warn',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
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
        {
            files: ['utils/meetingLogger.ts', '**/*.test.ts', '**/*.test.tsx'],
            rules: {
                'proton/restricted-imports': 'error',
            },
        },
    ],
});
