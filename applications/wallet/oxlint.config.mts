import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['assets/sandbox.js', '**/pkg/**'],
    overrides: [
        refObjectNullOverride,
        {
            files: ['**/*.test.ts'],
            rules: {
                'max-classes-per-file': 'off',
                'class-methods-use-this': 'off',
            },
        },
    ],
});
