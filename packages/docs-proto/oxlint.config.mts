import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['lib/Generated/**'],
    overrides: [
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
    ],
});
