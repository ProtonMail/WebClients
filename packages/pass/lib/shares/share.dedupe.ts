import type { Share as ShareCore, TargetType } from '@protontech/pass-rust-core/worker';

import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
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
});

const ROLE_PRIORITY: Record<string, number> = { '1': 3, '2': 2, '3': 1 };
const rolePriority = (role: string) => ROLE_PRIORITY[role] ?? 0;

/** JS mirror of the Rust `visible_share_ids` used as WASM fallback.
 * Deduplicates per (vault_id, target_type, target_id) keeping best role,
 * hides item shares superseded by their parent vault, and produces both
 * `dedupe` and `dedupeAndVisible` in one pass. */
export const getVisibleShareIds = (shares: ShareCore[]): ShareDedupeState => {
    const hiddenVaults = new Set<string>();
    const bestPerTriplet = new Map<string, ShareCore>();
    const vaultRolePriorities = new Map<string, number>();

    for (const share of shares) {
        if (!isShareVisible(share)) hiddenVaults.add(share.vault_id);
        const key = `${share.vault_id}:${share.target_type}:${share.target_id}`;
        const existing = bestPerTriplet.get(key);
        if (!existing) bestPerTriplet.set(key, share);
        else {
            const sp = rolePriority(share.role);
            const ep = rolePriority(existing.role);
            if (sp > ep || (sp === ep && share.vault_id < existing.vault_id)) bestPerTriplet.set(key, share);
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
