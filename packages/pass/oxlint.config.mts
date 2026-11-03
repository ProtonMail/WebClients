import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    ignorePatterns: ['asm/**', 'docs/starlight/**'],
    overrides: [
        {
            files: allGlobs,
            rules: {
                'no-console': ['error', { allow: ['warn', 'error'] }],
                curly: ['error', 'multi-line'],
            },
        },
    ],
});
