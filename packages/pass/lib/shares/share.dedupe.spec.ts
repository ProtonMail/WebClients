import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import type { Share } from '@proton/pass/types';
import { ShareFlags, ShareRole, ShareType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { dedupeShares } from './share.dedupe';

const createShare = (overrides: Partial<Share> = {}): Share => ({
    shareId: `share-${uniqueId()}`,
    vaultId: `vault-${uniqueId()}`,
    targetId: `target-${uniqueId()}`,
    targetType: ShareType.Vault,
    shareRoleId: ShareRole.MANAGER,
    permission: 1,
    flags: 0,
    addressId: undefined,
    content: { name: 'Test', description: '', display: {} },
    createTime: 0,
    canAutofill: undefined,
    newUserInvitesReady: 0,
    owner: true,
    shared: false,
    targetMaxMembers: 10,
    targetMembers: 1,
    eventId: 'event-1',
    groupId: null,
    ...overrides,
});

describe('dedupeShares [WASM & Fallback Paths]', () => {
    const core = createPassCoreProxy({} as any);
    const brokenCore = { get_visible_shares: () => Promise.reject(new Error('WASM failure')) } as any;

    /** Asserts both WASM and Fallback paths give the exact same results.
     * If tests fail: likely WASM implementation has changed and the fallback
     * path needs to reflect the changes. */
    const assertPaths = async (shares: Share[]) => {
        const [wasm, fallback] = await Promise.all([dedupeShares(shares, core), dedupeShares(shares, brokenCore)]);
        expect(wasm.dedupe).toEqual(expect.arrayContaining(fallback.dedupe));
        expect(fallback.dedupe).toEqual(expect.arrayContaining(wasm.dedupe));
        expect(wasm.dedupeAndVisible).toEqual(expect.arrayContaining(fallback.dedupeAndVisible));
        expect(fallback.dedupeAndVisible).toEqual(expect.arrayContaining(wasm.dedupeAndVisible));
        return wasm;
    };

    test('empty shares returns empty state', async () => {
        expect(await assertPaths([])).toEqual({ dedupe: [], dedupeAndVisible: [] });
    });

    test('single vault share is kept', async () => {
        const share = createShare({ shareId: 'vault1', vaultId: 'v1' });
        const { dedupe } = await assertPaths([share]);
        expect(dedupe).toContain('vault1');
    });

    test('deduplicates same target keeping best role', async () => {
        const vaultId = 'v1';
        const targetId = 'item1';
        const read = createShare({
            shareId: 'share_read',
            vaultId,
            targetId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const write = createShare({
            shareId: 'share_write',
            vaultId,
            targetId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.WRITE,
        });
        const admin = createShare({
            shareId: 'share_admin',
            vaultId,
            targetId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.MANAGER,
        });
        const { dedupe } = await assertPaths([read, write, admin]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('share_admin');
    });

    test('vault share hides item shares with equal or worse role', async () => {
        const vaultId = 'v1';
        const vault = createShare({ shareId: 'vault_write', vaultId, targetId: vaultId, shareRoleId: ShareRole.WRITE });
        const itemRead = createShare({
            shareId: 'item_read',
            vaultId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const itemWrite = createShare({
            shareId: 'item_write',
            vaultId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.WRITE,
        });
        const { dedupe } = await assertPaths([vault, itemRead, itemWrite]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('vault_write');
    });

    test('item share with better role than vault is kept', async () => {
        const vaultId = 'v1';
        const vault = createShare({ shareId: 'vault_read', vaultId, targetId: vaultId, shareRoleId: ShareRole.READ });
        const itemWrite = createShare({
            shareId: 'item_write',
            vaultId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.WRITE,
        });
        const { dedupe } = await assertPaths([vault, itemWrite]);
        expect(dedupe).toHaveLength(2);
        expect(dedupe).toContain('vault_read');
        expect(dedupe).toContain('item_write');
    });

    test('item share without parent vault is kept', async () => {
        const vault = createShare({ shareId: 'vault1_admin', vaultId: 'v1', targetId: 'v1' });
        const item = createShare({
            shareId: 'v2_item_read',
            vaultId: 'v2',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const { dedupe } = await assertPaths([vault, item]);
        expect(dedupe).toHaveLength(2);
        expect(dedupe).toContain('vault1_admin');
        expect(dedupe).toContain('v2_item_read');
    });

    test('hidden share is excluded from dedupeAndVisible but present in dedupe', async () => {
        const visible = createShare({ shareId: 'visible', vaultId: 'v1' });
        const hidden = createShare({ shareId: 'hidden', vaultId: 'v2', flags: ShareFlags.HIDDEN });
        const result = await assertPaths([visible, hidden]);
        expect(result.dedupe).toContain('visible');
        expect(result.dedupe).toContain('hidden');
        expect(result.dedupeAndVisible).toContain('visible');
        expect(result.dedupeAndVisible).not.toContain('hidden');
    });

    test('hidden vault excludes all its shares from dedupeAndVisible', async () => {
        const vaultId = 'v1';
        const hiddenVault = createShare({
            shareId: 'hidden_vault',
            vaultId,
            targetId: vaultId,
            flags: ShareFlags.HIDDEN,
        });
        const itemInHiddenVault = createShare({
            shareId: 'item_in_hidden',
            vaultId,
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const otherItem = createShare({ shareId: 'other_item', vaultId: 'v2', targetType: ShareType.Item });
        const result = await assertPaths([hiddenVault, itemInHiddenVault, otherItem]);
        expect(result.dedupeAndVisible).toHaveLength(1);
        expect(result.dedupeAndVisible).toContain('other_item');
    });
});
