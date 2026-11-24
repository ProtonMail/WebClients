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
            files: ['**/vite.dev.config.mts'],
            rules: {
                'proton/no-extraneous-dependencies': [
                    'error',
                    {
                        devDependencies: [...extraneousDependenciesDevDependencies, '**/vite.dev.config.mts'],
                        optionalDependencies: false,
                    },
                ],
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
                        ...['react-router', 'react-router-dom', 'react-router-dom-v5-compat'].map((name) => ({
                            name,
                            message:
                                'The host owns the paths and the history: read and change the route with useHomepageRoute(), from HomepageDependencies.navigation.',
                        })),
                    ],
                    patterns: [
                        {
                            group: ['@proton/*', '@proton/**'],
                            message:
                                'The homepage is host-independent: get host values from HomepageDependencies (useHomepageView() / useDocumentActions()), strings from useHomepageMessages(), icons from components/Icon.tsx, and Drive from @protontech/drive-sdk. See src/app/homepage/README.md.',
                        },
                        {
                            group: ['~/*', '~/**'],
                            message:
                                'The homepage imports no code from outside its folder: copy what it needs into it, or have the host inject it through HomepageDependencies. See src/app/homepage/README.md.',
                        },
                    ],
                }),
            },
        },
    ],
});
