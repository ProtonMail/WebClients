import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['asm/**', 'docs/starlight/**'],
    overrides: [
        refObjectNullOverride,
        {
            files: ['vitest.d.ts', 'testing/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/vitest.d.ts', '**/testing/**'],
                }),
            },
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
