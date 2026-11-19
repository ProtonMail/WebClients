import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
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
            files: ['src/app/homepage/**'],
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    paths: [
                        { name: 'ttag', message: 'The host translates the homepage strings: see src/app/homepage/README.md.' },
                    ],
                }),
            },
        },
    ],
});
