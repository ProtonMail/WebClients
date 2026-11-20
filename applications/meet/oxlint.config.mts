import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['src/background-blur-assets/**'],
    restrictedImports: {
        paths: [
            {
                name: '@protontech/logger',
                importNames: ['logger'],
                message:
                    'Use meetingLogger from @proton/meet/utils/meetingLogger, which prefixes the lines logged in a meeting with its meetingLinkName.',
            },
        ],
    },
    overrides: [
        refObjectNullOverride,
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                // Meet builds custom ARIA widgets (listbox, option, ...) and previously disabled this rule case by case
                'jsx-a11y/prefer-tag-over-role': 'off',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
        {
            files: ['src/app/bootstrap.ts', '**/*.test.ts', '**/*.test.tsx'],
            rules: {
                'proton/restricted-imports': 'error',
            },
        },
    ],
});
