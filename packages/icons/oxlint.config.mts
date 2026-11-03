import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            rules: {
                'jsx-a11y/prefer-tag-over-role': 'off',
            },
        },
    ],
});
