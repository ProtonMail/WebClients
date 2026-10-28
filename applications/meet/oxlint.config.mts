import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['src/background-blur-assets/**'],
    overrides: [
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
    ],
});
