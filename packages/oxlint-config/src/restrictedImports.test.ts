import { describe, expect, it } from 'vitest';

import { collectRestrictions, createRestrictedImportRule } from './restrictedImports.ts';

describe('createRestrictedImportRule', () => {
    it('returns the rule value with every option filled in', () => {
        expect(createRestrictedImportRule({ rollout: ['account-barrel'] })).toEqual([
            'error',
            { rollout: ['account-barrel'], paths: [], patterns: [] },
        ]);
    });

    it('throws on an unknown rollout id', () => {
        // @ts-expect-error unknown id on purpose
        expect(() => createRestrictedImportRule({ rollout: ['not-an-id'] })).toThrow(
            'Unknown restricted imports rollout id: not-an-id.'
        );
    });
});

describe('collectRestrictions', () => {
    const pathNames = (filename: string, options = {}) =>
        collectRestrictions(filename, options).paths.map((path) => path.name);
    const patternGroups = (filename: string) =>
        collectRestrictions(filename, {}).patterns.map((pattern) => pattern.group[0]);

    it('adds rollout and client paths after the base ones', () => {
        const names = pathNames('/repo/applications/account/src/a.ts', {
            rollout: ['account-barrel'],
            paths: [{ name: 'some-package' }],
        });
        expect(names.slice(-4)).toEqual([
            '@proton/account',
            '@proton/account/index',
            '@proton/account/index.ts',
            'some-package',
        ]);
        expect(names).toContain('@proton/atoms');
    });

    it('scopes the drive fence and the silent api ban by file', () => {
        expect(patternGroups('/repo/applications/account/src/a.ts')).toContain('@proton/drive/*');
        expect(patternGroups('/repo/applications/drive/src/a.ts')).not.toContain('@proton/drive/*');
        expect(patternGroups('/repo/applications/account/src/a.ts')).not.toContain(
            '@proton/shared/lib/api/helpers/customConfig'
        );
        expect(patternGroups('/repo/applications/account/src/a.tsx')).toContain(
            '@proton/shared/lib/api/helpers/customConfig'
        );
    });
});
