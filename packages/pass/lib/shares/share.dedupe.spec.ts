/** Mirror of the `@protontech/pass-rust-core` share dedupe test suite.
 * Keep these tests inline with the rust source: `proton-pass-common/src/share.rs::visible_share_ids` */
import type { Share } from '../../types';
import { ShareFlags, ShareRole, ShareType } from '../../types';
import { createPassCoreProxy } from '../core/core.proxy';
import { dedupeShares } from './share.dedupe';
import { createTestShare } from './share.test.utils';

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
            const share = createTestShare({ targetType });
            const { dedupe } = await assertPaths([share]);
            expect(dedupe).toHaveLength(1);
            expect(dedupe).toContain('share');
        }
    });

    test('disabled filter hidden works', async () => {
        /** When filter_hidden is false, the hidden flag has no effect.
         * The manager share (hidden) wins over the read share (visible) on role priority. */
        for (const targetType of TARGET_TYPES) {
            const visible = createTestShare({ shareId: 'sv', targetType, shareRoleId: ShareRole.READ });
            const hidden = createTestShare({
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
            const hidden = createTestShare({
                shareId: 'sh',
                vaultId: 'v1',
                targetType,
                shareRoleId: ShareRole.MANAGER,
                flags: ShareFlags.HIDDEN,
            });
            const visible = createTestShare({ shareId: 'sv', vaultId: 'v1', targetType, shareRoleId: ShareRole.READ });
            const other = createTestShare({ shareId: 'so', vaultId: 'v2', targetType, shareRoleId: ShareRole.READ });
            const { dedupeAndVisible } = await assertPaths([visible, hidden, other]);
            expect(dedupeAndVisible).toHaveLength(1);
            expect(dedupeAndVisible).toContain('so');
        }
    });

    test('hidden matches items in vault', async () => {
        /** A hidden vault share causes all items in that vault to be hidden too. */
        const vaultHidden = createTestShare({
            shareId: 'sh',
            vaultId: 'v1',
            targetType: ShareType.Vault,
            shareRoleId: ShareRole.MANAGER,
            flags: ShareFlags.HIDDEN,
        });
        const itemInHiddenVault = createTestShare({
            shareId: 'sv',
            vaultId: 'v1',
            targetType: ShareType.Item,
            targetId: '32',
            shareRoleId: ShareRole.READ,
        });
        const itemInOtherVault = createTestShare({
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
                const best = createTestShare({ shareId: 'best', targetType, shareRoleId: bestRole });
                const worse = createTestShare({ shareId: 'worse', targetType, shareRoleId: worseRole });
                const { dedupe } = await assertPaths([worse, best, worse, best]);
                expect(dedupe).toHaveLength(1);
                expect(dedupe).toContain('best');
            }
        }
    });

    test('vault masks item with less perms', async () => {
        /** An item share with equal or lower role than the vault share is hidden. */
        const writeVault = createTestShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.WRITE,
        });
        const readItem = createTestShare({
            shareId: 'item_read',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const writeItem = createTestShare({
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
        const readVault = createTestShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.READ,
        });
        const readItem = createTestShare({
            shareId: 'item_read',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const writeItem = createTestShare({
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
        const vault = createTestShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const item = createTestShare({
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
        const vault0Admin = createTestShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const vault0Write = createTestShare({
            shareId: 'vault_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.WRITE,
        });
        const item = createTestShare({
            shareId: 'item_read',
            vaultId: 'v1',
            targetType: ShareType.Item,
            shareRoleId: ShareRole.READ,
        });
        const vault2Write = createTestShare({
            shareId: 'vault_2_share',
            vaultId: 'v2',
            targetType: ShareType.Vault,
            targetId: 'v2',
            shareRoleId: ShareRole.WRITE,
        });
        const item2Write = createTestShare({
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
        const nonOwner = createTestShare({
            shareId: 'non_owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const owner = createTestShare({
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
        const groupShare1 = createTestShare({
            shareId: 'group_share_1',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
            groupId: 'g1',
        });
        const nonGroupShare = createTestShare({
            shareId: 'non_group_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
        });
        const groupShare2 = createTestShare({
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
        const newer = createTestShare({ shareId: 'newer', createTime: 2 });
        const older = createTestShare({ shareId: 'older', createTime: 1 });
        const { dedupe } = await assertPaths([newer, older]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('older');
    });

    test('give prio to older group shares', async () => {
        /** Among equal-role group shares, the older one (smaller create_time) wins. */
        const newer = createTestShare({ shareId: 'newer', createTime: 2, groupId: 'g1' });
        const older = createTestShare({ shareId: 'older', createTime: 1, groupId: 'g1' });
        const { dedupe } = await assertPaths([newer, older]);
        expect(dedupe).toHaveLength(1);
        expect(dedupe).toContain('older');
    });

    test('non-group beats group regardless of age', async () => {
        /** Non-group share wins over group share even if the group share is older. */
        const olderGroup = createTestShare({
            shareId: 'older_group',
            shareRoleId: ShareRole.MANAGER,
            createTime: 1,
            groupId: 'g1',
        });
        const newerNonGroup = createTestShare({
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
        const groupOwner = createTestShare({
            shareId: 'group_owner',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.MANAGER,
            owner: true,
            groupId: 'g1',
        });
        const nonGroup = createTestShare({
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
        const owner = createTestShare({
            shareId: 'owner_share',
            targetType: ShareType.Vault,
            targetId: 'v0',
            shareRoleId: ShareRole.READ,
            owner: true,
        });
        const nonOwner = createTestShare({
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
