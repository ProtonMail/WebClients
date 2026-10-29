import { createExtraneousDependenciesRule, extraneousDependenciesDevDependencies } from '@proton/oxlint-config/extraneousDependencies';
import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';
import { createRestrictedImportRule } from '@proton/oxlint-config/restrictedImports';

const hostImports = ['@proton/**', 'ttag'];

const sheetsIconsPattern = {
    group: ['@proton/icons', '@proton/icons/**', '@rowsncolumns/icons', '@rowsncolumns/icons/**'],
    message:
        'Use icons from Spreadsheet/components/icons so standalone Sheets does not depend on an external icon registry or package.',
};

const driveStorePattern = {
    group: ['@proton/drive-store*'],
    message: 'docs-editor should not import from drive-store. Use @proton/docs-shared or @proton/docs-core instead.',
};

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            driveStorePattern,
            {
                group: ['**/Docs/**', '!**/Docs/public'],
                caseSensitive: true,
                message: 'Import Containers/Docs only through its public.ts, or its testing.ts from tests.',
            },
        ],
    },
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react-hooks/exhaustive-deps': 'warn',
                'no-unused-vars': 'off',
                'proton/naming-convention': 'off',
                'no-use-before-define': ['error', { functions: false, classes: false }],
                'no-console': ['warn', { allow: ['warn', 'error', 'trace'] }],
                'max-classes-per-file': 'off',
                // TODO: Remove this rule once the compat issue is resolved
                'compat/compat': 'off',
            },
        },
        {
            files: ['**/*.{test,spec}.{ts,tsx}'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    patterns: [
                        driveStorePattern,
                        {
                            group: ['**/Docs/**', '!**/Docs/public', '!**/Docs/testing'],
                            caseSensitive: true,
                            message: 'Import Containers/Docs only through its public.ts or testing.ts.',
                        },
                    ],
                }),
            },
        },
        {
            files: ['**/*.test.ts'],
            rules: {
                'max-classes-per-file': 'off',
                'class-methods-use-this': 'off',
            },
        },
        {
            files: ['**/TestUtils/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/TestUtils/**'],
                }),
            },
        },
        {
            files: ['src/standalone-sheet/**/*.{ts,tsx}'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({ patterns: [sheetsIconsPattern] }),
            },
        },
        {
            files: ['src/app/Containers/Spreadsheet/**/*.{ts,tsx}'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    patterns: [
                        sheetsIconsPattern,
                        {
                            group: hostImports,
                            message:
                                'Containers/Spreadsheet is host-independent: get host values from useSheetsDependencies() and strings from useSheetsMessages().',
                        },
                    ],
                }),
            },
        },
        {
            files: ['src/app/Containers/Docs/**/*.{ts,tsx}'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    patterns: [
                        {
                            group: ['@proton/icons', '@proton/icons/**'],
                            message:
                                'Use Docs/Components/Icon with data from Docs/Components/icons so the Docs editor does not depend on the Proton icon registry.',
                        },
                        {
                            group: hostImports,
                            message:
                                'Containers/Docs is host-independent: get host values from useDocsDependencies() and strings from useDocsMessages().',
                        },
                    ],
                }),
            },
        },
    ],
});
