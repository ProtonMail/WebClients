import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { extraneousDependenciesDevDependencies } from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';
import { createRestrictedImportRule } from '@proton/oxlint-config/restrictedImports';

export default createOxlintConfig({

    overrides: [
        refObjectNullOverride,
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                'no-unused-vars': 'off',
                'no-use-before-define': 'off',
                'proton/naming-convention': 'off',
                'no-console': ['warn', { allow: ['warn', 'error', 'trace'] }],
            },
        },
        {
            files: ['vitest.setup.dom.ts'],
            rules: {
                'proton/no-extraneous-dependencies': [
                    'error',
                    {
                        devDependencies: [...extraneousDependenciesDevDependencies, '**/vitest.setup.dom.ts'],
                        optionalDependencies: false,
                    },
                ],
            },
        },
        {
            files: ['src/app/homepage/**'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    paths: [
                        { name: 'ttag', message: 'The host translates the homepage strings: see src/app/homepage/README.md.' },
                    ],
                    patterns: [
                        {
                            group: ['@proton/icons', '@proton/icons/*', '@proton/file-icons', '@proton/file-icons/*'],
                            message:
                                'The homepage draws its own icons with components/Icon.tsx, icons.tsx and FileTypeIcon.tsx: see src/app/homepage/README.md.',
                        },
                    ],
                }),
            },
        },
    ],
});
