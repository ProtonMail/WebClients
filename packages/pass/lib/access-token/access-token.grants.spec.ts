import type { PersonalAccessTokenShareResponse } from '../../types/api/pass';
import { ShareRole, ShareType } from '../../types/data/shares';
import { diffPatGrants, formatPatRoleSummary } from './access-token.grants';

const vaultGrant = (
    overrides: Partial<PersonalAccessTokenShareResponse> &
        Pick<PersonalAccessTokenShareResponse, 'ShareID' | 'ParentShareID'>
): PersonalAccessTokenShareResponse => ({
    VaultID: 'vault',
    TargetID: 'vault',
    TargetType: ShareType.Vault,
    ShareRoleID: ShareRole.READ,
    CreateTime: 0,
    ...overrides,
});

describe('diffPatGrants', () => {
    const manageable = new Set(['parent-a', 'parent-b']);

    it('grants new vault access', () => {
        const result = diffPatGrants([], [{ shareId: 'parent-a', role: ShareRole.WRITE }], manageable);
        expect(result.toRemovePatShareIds).toEqual([]);
        expect(result.toAdd).toEqual([{ shareId: 'parent-a', role: ShareRole.WRITE }]);
        expect(result.roleUpdates).toEqual([]);
    });

    it('revokes removed vault access', () => {
        const current = [vaultGrant({ ShareID: 'pat-share-a', ParentShareID: 'parent-a' })];
        const result = diffPatGrants(current, [], manageable);
        expect(result.toRemovePatShareIds).toEqual(['pat-share-a']);
        expect(result.toAdd).toEqual([]);
        expect(result.roleUpdates).toEqual([]);
    });

    it('revokes and re-grants on role change', () => {
        const current = [
            vaultGrant({ ShareID: 'pat-share-a', ParentShareID: 'parent-a', ShareRoleID: ShareRole.READ }),
        ];
        const result = diffPatGrants(current, [{ shareId: 'parent-a', role: ShareRole.WRITE }], manageable);
        expect(result.toRemovePatShareIds).toEqual([]);
        expect(result.toAdd).toEqual([]);
        expect(result.roleUpdates).toEqual([
            {
                revokePatShareId: 'pat-share-a',
                grant: { shareId: 'parent-a', role: ShareRole.WRITE },
            },
        ]);
    });

    it('preserves manager grants when vault stays selected', () => {
        const current = [
            vaultGrant({ ShareID: 'pat-share-a', ParentShareID: 'parent-a', ShareRoleID: ShareRole.MANAGER }),
        ];
        const result = diffPatGrants(current, [{ shareId: 'parent-a', role: ShareRole.MANAGER }], manageable);
        expect(result.toRemovePatShareIds).toEqual([]);
        expect(result.toAdd).toEqual([]);
        expect(result.roleUpdates).toEqual([]);
    });

    it('revokes manager when vault is deselected', () => {
        const current = [
            vaultGrant({ ShareID: 'pat-share-a', ParentShareID: 'parent-a', ShareRoleID: ShareRole.MANAGER }),
        ];
        const result = diffPatGrants(current, [], manageable);
        expect(result.toRemovePatShareIds).toEqual(['pat-share-a']);
    });
});

describe('formatPatRoleSummary', () => {
    it('returns no vault access when there are no vault grants', () => {
        expect(formatPatRoleSummary([])).toBe('No vault access');
    });

    it('returns a single role label', () => {
        expect(
            formatPatRoleSummary([vaultGrant({ ShareID: '1', ParentShareID: 'p', ShareRoleID: ShareRole.READ })])
        ).toBe('Viewer');
    });

    it('joins mixed roles', () => {
        expect(
            formatPatRoleSummary([
                vaultGrant({ ShareID: '1', ParentShareID: 'a', ShareRoleID: ShareRole.READ }),
                vaultGrant({ ShareID: '2', ParentShareID: 'b', ShareRoleID: ShareRole.WRITE }),
            ])
        ).toBe('Editor · Viewer');
    });
});
