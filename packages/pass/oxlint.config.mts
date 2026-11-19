import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['asm/**', 'docs/starlight/**'],
    overrides: [
        refObjectNullOverride,
        {
            files: ['vitest.config.ts', 'vitest.setup.ts', 'vitest.d.ts', 'testing/vitest/**'],
            rules: { 'proton/no-extraneous-dependencies': 'off' },
        },
        {
            files: allGlobs,
            rules: {
                'no-console': ['error', { allow: ['warn', 'error'] }],
                curly: ['error', 'multi-line'],
            },
        },
    ],
});
