import { describe, expect, it } from 'vitest';

import { allGlobs } from './globs.ts';
import { all, base, createOxlintConfig } from './index.ts';

describe('createOxlintConfig', () => {
    it('extends the all preset by default and copies the fields extends drops', () => {
        const config = createOxlintConfig();

        expect(config.extends).toEqual([all]);
        expect(config.env).toEqual({ builtin: true, browser: true });
        expect(config.settings).toEqual({ polyfills: ['es:all', 'ResizeObserver'] });
        expect(config.ignorePatterns).toEqual(base.ignorePatterns);
        expect(config.overrides).toEqual([]);
    });

    it('extends the base preset, which has no React, jsx-a11y or UI rules', () => {
        const config = createOxlintConfig({ preset: 'base' });

        expect(config.extends).toEqual([base]);
        expect(config.env).toEqual({ builtin: true, browser: true });
        expect(config.settings).toEqual({ polyfills: ['es:all', 'ResizeObserver'] });
        expect(base.plugins).toEqual(['typescript', 'import']);
        expect(base.rules).toEqual({ 'custom-rules/no-package-self-import': 'error', 'compat/compat': 'error' });
        expect(all.plugins).toEqual(['typescript', 'import', 'react', 'jsx-a11y']);
        expect(all.rules).toMatchObject({ 'react/rules-of-hooks': 'error', 'custom-rules/validate-ttag': 'error' });
        expect(all.overrides).toBe(base.overrides);
    });

    it('appends workspace ignore patterns to the shared ones', () => {
        const config = createOxlintConfig({ ignorePatterns: ['testing/vitest/**'] });

        expect(config.ignorePatterns).toEqual([...(base.ignorePatterns ?? []), 'testing/vitest/**']);
        expect(config.ignorePatterns).toContain('**/public/assets/**');
    });

    it('puts the restricted imports rule first, then the workspace overrides', () => {
        const workspaceOverride = { files: ['testing/**'], rules: { 'no-console': 'off' as const } };

        const config = createOxlintConfig({
            restrictedImports: { rollout: ['components-barrel'] },
            overrides: [workspaceOverride],
        });

        expect(config.overrides).toEqual([
            {
                files: allGlobs,
                rules: {
                    'proton/restricted-imports': ['error', { rollout: ['components-barrel'], paths: [], patterns: [] }],
                },
            },
            workspaceOverride,
        ]);
    });
});
