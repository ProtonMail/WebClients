/** JS mirror of the `@protontech/pass-rust-core` share dedupe logic.
 * Keep this file inline with the rust source: `proton-pass-common/src/share.rs::visible_share_ids` */
import type { Share as ShareCore, TargetType } from '@protontech/pass-rust-core/worker';

import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { isGroupShare, isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import type { Share, ShareId } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const intoTargetType = (type: ShareType): TargetType => {
    switch (type) {
        case ShareType.Vault:
            return 'Vault';
        case ShareType.Item:
            return 'Item';
    }
};

export const intoShareCore = (share: Share): ShareCore => ({
    share_id: share.shareId,
    vault_id: share.vaultId,
    target_type: intoTargetType(share.targetType),
    target_id: share.targetId,
    role: share.shareRoleId,
    permissions: share.permission,
    flags: share.flags,
    create_time: share.createTime,
    is_group_share: isGroupShare(share),
    user_is_vault_owner: share.owner,
});

const ROLE_PRIORITY: Record<string, number> = { '1': 3, '2': 2, '3': 1 };
const rolePriority = (role: string) => ROLE_PRIORITY[role] ?? 0;

/** WASM fallback for `dedupeShares`. The rust implementation derives each output
 * via a separate `visible_share_ids(_, filter_hidden)` call. Here we compute both
 * in a single pass: both `dedupe` and `dedupeAndVisible` are returned. */
export const getVisibleShareIds = (shares: ShareCore[]): ShareDedupeState => {
    const hiddenVaults = new Set<string>();
    const bestPerTriplet = new Map<string, ShareCore>();
    const vaultRolePriorities = new Map<string, number>();

    for (const share of shares) {
        if (!isShareVisible(share)) hiddenVaults.add(share.vault_id);
        const key = `${share.vault_id}:${share.target_type}:${share.target_id}`;
        const existing = bestPerTriplet.get(key);
        if (!existing) bestPerTriplet.set(key, share);
        else if (share.user_is_vault_owner && !share.is_group_share) {
            /** Always give priority to the share of the owner of the vault.
             * Checking also that the share is not group since clients may
             * assign owner if just the vault id matches. */
            bestPerTriplet.set(key, share);
        } else if (existing.user_is_vault_owner && !existing.is_group_share) {
            /** If existing is already vault owner no need to check anything else */
        } else {
            const sp = rolePriority(share.role);
            const ep = rolePriority(existing.role);
            if (sp > ep) bestPerTriplet.set(key, share);
            else if (sp === ep) {
                /** If the existing is a group one but the new one is not, keep the new one */
                if (existing.is_group_share && !share.is_group_share) bestPerTriplet.set(key, share);
                /** If it's an older share keep it and both have the same group share property */
                if (share.create_time < existing.create_time && existing.is_group_share === share.is_group_share) {
                    bestPerTriplet.set(key, share);
                }
            }
        }
    }

    for (const share of bestPerTriplet.values()) {
        if (share.target_type === 'Vault') vaultRolePriorities.set(share.vault_id, rolePriority(share.role));
    }

    const dedupe: ShareId[] = [];
    const dedupeAndVisible: ShareId[] = [];

    for (const share of bestPerTriplet.values()) {
        const vaultPrio = vaultRolePriorities.get(share.vault_id);
        const rolePrio = rolePriority(share.role);
        const visible = share.target_type === 'Vault' || vaultPrio === undefined || rolePrio > vaultPrio;

        if (visible) {
            dedupe.push(share.share_id);
            if (!hiddenVaults.has(share.vault_id)) dedupeAndVisible.push(share.share_id);
        }
    }

    hiddenVaults.clear();
    bestPerTriplet.clear();
    vaultRolePriorities.clear();

    return { dedupe, dedupeAndVisible };
};

export const dedupeShares = async (allShares: Share[], core: PassCoreProxy): Promise<ShareDedupeState> => {
    const shares = allShares.map(intoShareCore);

    try {
        const [dedupe, dedupeAndVisible] = await Promise.all([
            core.get_visible_shares(shares, false),
            core.get_visible_shares(shares, true),
        ]);

        return { dedupe, dedupeAndVisible };
    } catch (err) {
        /** WASM may fail for non-clearly identified reasons (race conditions,
         * worker not yet started, dev tools interference). An empty dedupe
         * state would cause no data to be shown, so fall back to the JS
         * mirror of the WASM dedupe to ensure ids are never empty. */
        logger.debug('[Share] WASM Dedupe failure', err);
        return getVisibleShareIds(shares);
    }
};
