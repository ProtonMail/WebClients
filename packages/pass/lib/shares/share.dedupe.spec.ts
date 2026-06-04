/** Mirror of the `@protontech/pass-rust-core` share dedupe test suite.
 * Keep these tests inline with the rust source: `proton-pass-common/src/share.rs::visible_share_ids` */
import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import type { Share } from '@proton/pass/types';
import { ShareFlags, ShareRole, ShareType } from '@proton/pass/types';

import { dedupeShares } from './share.dedupe';

const createShare = (overrides: Partial<Share> = {}): Share => ({
    shareId: 'share',
    vaultId: 'v',
    targetId: '1',
    targetType: ShareType.Vault,
    shareRoleId: ShareRole.READ,
    permission: 0,
    flags: 0,
    addressId: undefined,
    content: { name: 'Test', description: '', display: {} },
    createTime: 0,
    canAutofill: undefined,
    newUserInvitesReady: 0,
    owner: false,
    shared: false,
    targetMaxMembers: 10,
    targetMembers: 1,
    eventId: 'event-1',
    groupId: null,
    ...overrides,
});

const TARGET_TYPES = [ShareType.Vault, ShareType.Item];

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

    test('empty list', async () => {
        const { dedupe } = await assertPaths([]);
        expect(dedupe).toHaveLength(0);
    });

    test('simple return for all types', async () => {
        for (const targetType of TARGET_TYPES) {
            const share = createShare({ targetType });
            const { dedupe } = await assertPaths([share]);
            expect(dedupe).toHaveLength(1);
            expect(dedupe).toContain('share');
        }
    });

    test('disabled filter hidden works', async () => {
        /** When filter_hidden is false, the hidden flag has no effect.
         * The manager share (hidden) wins over the read share (visible) on role priority. */
        for (const targetType of TARGET_TYPES) {
            const visible = createShare({ shareId: 'sv', targetType, shareRoleId: ShareRole.READ });
            const hidden = createShare({
                shareId: 'sh',
                targetType,
                shareRoleId: ShareRole.MANAGER,
                flags: ShareFlags.HIDDEN,
            });
            const { dedupe } = await assertPaths([visible, hidden]);
            expect(dedupe).toHaveLength(1);
            expect(dedupe).toContain('sh');
        }
    });

    test('hidden matches all shares for vault', async () => {
        /** When a vault has a hidden share, all shares in that vault are filtered out. */
        for (const targetType of TARGET_TYPES) {
            const hidden = createShare({
                shareId: 'sh',
                vaultId: 'v1',
                targetType,
                shareRoleId: ShareRole.MANAGER,
                flags: ShareFlags.HIDDEN,
            });
            const visible = createShare({ shareId: 'sv', vaultId: 'v1', targetType, shareRoleId: ShareRole.READ });
            const other = createShare({ shareId: 'so', vaultId: 'v2', targetType, shareRoleId: ShareRole.READ });
            const { dedupeAndVisible } = await assertPaths([visible, hidden, other]);
            expect(dedupeAndVisible).toHaveLength(1);
            expect(dedupeAndVisible).toContain('so');
        }
    });

    test('hidden matches items in vault', async () => {
        /** A hidden vault share causes all items in that vault to be hidden too. */
        const vaultHidden = createShare({
            shareId: 'sh',
            vaultId: 'v1',
            targetType: ShareType.Vault,
            shareRoleId: ShareRole.MANAGER,
            flags: ShareFlags.HIDDEN,
        });
        const itemInHiddenVault = createShare({
            shareId: 'sv',
            vaultId: 'v1',
            targetType: ShareType.Item,
            targetId: '32',
            shareRoleId: ShareRole.READ,
        });
        const itemInOtherVault = createShare({
            shareId: 'so',
            vaultId: 'v2',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const { dedupeAndVisible } = await assertPaths([vaultHidden, itemInHiddenVault, itemInOtherVault]);
        expect(dedupeAndVisible).toHaveLength(1);
        expect(dedupeAndVisible).toContain('so');
    });

    test('shadow target with worse role', async () => {
        /** Only the highest-role share per (vault, target_type, target_id) is kept. */
        const roleTests: [ShareRole, ShareRole][] = [
            [ShareRole.MANAGER, ShareRole.WRITE],
            [ShareRole.MANAGER, ShareRole.READ],
            [ShareRole.WRITE, ShareRole.READ],
        ];
        for (const targetType of TARGET_TYPES) {
            for (const [bestRole, worseRole] of roleTests) {
                const best = createShare({ shareId: 'best', targetType, shareRoleId: bestRole });
                const worse = createShare({ shareId: 'worse', targetType, shareRoleId: worseRole });
                const { dedupe } = await assertPaths([worse, best, worse, best]);
                expect(dedupe).toHaveLength(1);
                expect(dedupe).toContain('best');
            }
        }
    });

    test('vault masks item with less perms', async () => {
        /** An item share with equal or lower role than the vault share is hidden. */
        const writeVault = createShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.WRITE,
        });
        const readItem = createShare({ shareId: 'item_read', targetType: ShareType.Item, shareRoleId: ShareRole.READ });
        const writeItem = createShare({
            shareId: 'item_write',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.WRITE,
        });
        const { dedupe } = await assertPaths([writeVault, writeItem, readItem]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('vault_share');
    });

    test('vault masks item with more perms', async () => {
        /** An item share with a higher role than the vault share is kept alongside the vault share. */
        const readVault = createShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.READ,
        });
        const readItem = createShare({ shareId: 'item_read', targetType: ShareType.Item, shareRoleId: ShareRole.READ });
        const writeItem = createShare({
            shareId: 'item_write',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.WRITE,
        });
        const { dedupe } = await assertPaths([readVault, writeItem, readItem]);
        expect(dedupe).toHaveLength(2);
        expect(dedupe).toContain('vault_share');
        expect(dedupe).toContain('item_write');
    });

    test('keep items in other vault', async () => {
        /** An item share in a different vault from any vault share is always kept. */
        const vault = createShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const item = createShare({
            shareId: 'item_read',
            vaultId: 'v1',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const { dedupe } = await assertPaths([vault, item]);
        expect(dedupe).toHaveLength(2);
        expect(dedupe).toContain('vault_share');
        expect(dedupe).toContain('item_read');
    });

    test('mixed vault and item shares are kept if item has more perms', async () => {
        /** vault_0_admin supersedes vault_0_write (same triplet, higher role).
         * item in v1 has no parent vault share, so it is kept.
         * item_2_write in v2 has same role as vault_2_write, so it is masked. */
        const vault0Admin = createShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const vault0Write = createShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.WRITE,
        });
        const item = createShare({
            shareId: 'item_read',
            vaultId: 'v1',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const vault2Write = createShare({
            shareId: 'vault_2_share',
            vaultId: 'v2',
            targetType: ShareType.Vault,
            targetId: 'v2',
            shareRoleId: ShareRole.WRITE,
        });
        const item2Write = createShare({
            shareId: 'item_2_write',
            vaultId: 'v2',
            targetType: ShareType.Item,
            targetId: '2',
            shareRoleId: ShareRole.WRITE,
        });
        const { dedupe } = await assertPaths([vault2Write, vault0Write, vault0Admin, item, item2Write]);
        expect(dedupe).toHaveLength(3);
        expect(dedupe).toContain('vault_share');
        expect(dedupe).toContain('item_read');
        expect(dedupe).toContain('vault_2_share');
    });

    test('give prio to vault owner', async () => {
        /** The owner's share is kept even when another share has a higher role. */
        const nonOwner = createShare({
            shareId: 'non_owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const owner = createShare({
            shareId: 'owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.READ,
            owner: true,
        });
        const { dedupe } = await assertPaths([nonOwner, owner]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('owner_share');
    });

    test('give prio to non-group shares', async () => {
        /** Among equal-role shares, the non-group share is preferred over group shares. */
        const groupShare1 = createShare({
            shareId: 'group_share_1',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
            groupId: 'g1',
        });
        const nonGroupShare = createShare({
            shareId: 'non_group_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const groupShare2 = createShare({
            shareId: 'group_share_2',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
            groupId: 'g2',
        });
        const { dedupe } = await assertPaths([groupShare1, nonGroupShare, groupShare2]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('non_group_share');
    });

    test('give prio to older shares', async () => {
        /** Among equal-role non-group shares, the older one (smaller create_time) wins. */
        const newer = createShare({ shareId: 'newer', createTime: 2 });
        const older = createShare({ shareId: 'older', createTime: 1 });
        const { dedupe } = await assertPaths([newer, older]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('older');
    });

    test('give prio to older group shares', async () => {
        /** Among equal-role group shares, the older one (smaller create_time) wins. */
        const newer = createShare({ shareId: 'newer', createTime: 2, groupId: 'g1' });
        const older = createShare({ shareId: 'older', createTime: 1, groupId: 'g1' });
        const { dedupe } = await assertPaths([newer, older]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('older');
    });

    test('non-group beats group regardless of age', async () => {
        /** Non-group share wins over group share even if the group share is older. */
        const olderGroup = createShare({
            shareId: 'older_group',
            shareRoleId: ShareRole.MANAGER,
            createTime: 1,
            groupId: 'g1',
        });
        const newerNonGroup = createShare({
            shareId: 'newer_non_group',
            shareRoleId: ShareRole.MANAGER,
            createTime: 2,
        });
        const { dedupe } = await assertPaths([olderGroup, newerNonGroup]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('newer_non_group');
    });

    test('vault owner group share does not get vault owner priority', async () => {
        /** A group share with user_is_vault_owner=true should NOT receive vault-owner priority.
         * The `!is_group_share` guard means it falls through to normal role/age/group tiebreaks. */
        const groupOwner = createShare({
            shareId: 'group_owner',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
            owner: true,
            groupId: 'g1',
        });
        const nonGroup = createShare({
            shareId: 'non_group',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const { dedupe } = await assertPaths([groupOwner, nonGroup]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('non_group');
    });

    test('existing vault owner is not overridden by non-owner', async () => {
        /** When the existing entry is already a non-group vault-owner share,
         * a later non-owner share with a higher role should not displace it. */
        const owner = createShare({
            shareId: 'owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.READ,
            owner: true,
        });
        const nonOwner = createShare({
            shareId: 'non_owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const { dedupe } = await assertPaths([owner, nonOwner]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('owner_share');
    });
});
