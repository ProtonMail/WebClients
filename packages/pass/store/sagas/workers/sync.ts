import { type Share, type ShareGetResponse, ShareType } from '@proton/pass/types';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { fullMerge, merge, objectFilter } from '@proton/pass/utils/object';
import { toMap } from '@proton/shared/lib/helpers/object';

import type { ItemsByShareId } from '../../reducers';
import type { SharesState } from '../../reducers/shares';
import { selectAllShares, selectItems } from '../../selectors';
import type { State, WorkerRootSagaOptions } from '../../types';
import { requestItemsForShareId } from './items';
import { loadShare, requestShares } from './shares';
import { createVault } from './vaults';

export type SynchronizationResult = {
    shares: SharesState;
    items: ItemsByShareId;
};

export enum SyncType {
    FULL = 'full',
    PARTIAL = 'partial',
}

/**
 * TODO: Handle offline mode here
 * If no network, fallback to using the initial state
 * as our only source of truth
 * FIXME: handle ItemShares
 */
export function* synchronize(
    state: State,
    type: SyncType,
    { onShareEventDisabled }: WorkerRootSagaOptions
): Generator<unknown, SynchronizationResult> {
    const cachedShares = selectAllShares(state);
    const remote = ((yield requestShares()) as ShareGetResponse[]).sort((a, b) => b.CreateTime - a.CreateTime);
    const vaults = remote.filter((share) => share.TargetType === ShareType.Vault);

    const cachedShareIds = cachedShares.map(({ shareId }) => shareId);
    const remoteShareIds = remote.map(({ ShareID }) => ShareID);
    const deletedShareIds = cachedShareIds.filter((shareId) => !remoteShareIds.includes(shareId));

    /* notify clients of possible deleted shares */
    deletedShareIds.forEach((shareId) => onShareEventDisabled?.(shareId));

    /**
     * only load shares that are
     * not currently present in cache
     */
    const synced = (yield Promise.all(
        remote
            .filter((data) => !cachedShareIds.includes(data.ShareID))
            .map((share) => loadShare(share.ShareID, share.TargetType))
    )) as Share[];

    /**
     * On first login, remote shares will be
     * empty and we need to create the initial
     * vault share
     */
    if (vaults.length === 0) {
        logger.info(`[Saga::Sync] No vault found, creating default..`);
        synced.push(
            (yield createVault({
                name: 'Personal',
                description: 'Personal vault',
                display: {},
            })) as Share<ShareType.Vault>
        );
    }

    logger.info(`[Sync::Shares] Discovered ${cachedShares.length} share(s) in cache`);
    logger.info(`[Sync::Shares] User has ${remote.length} share(s) in database`);
    logger.info(`[Sync::Shares] ${deletedShareIds.length} share(s) deleted`);
    logger.info(`[Sync::Shares] ${synced.length} share(s) need to be synced`);
    logger.info(`[Sync::Shares] Performing ${type} sync`);

    /**
     * On full sync : we want to request all items for each share
     * On partial sync : only request items for new shares (event-loop
     * will take care of updates) and remove items from deleted shares;
     */
    const fullSync = type === SyncType.FULL;
    const itemShareIds = fullSync ? remoteShareIds : synced.map(({ shareId }) => shareId);
    const itemState = fullSync ? {} : objectFilter(selectItems(state), (shareId) => !deletedShareIds.includes(shareId));

    const syncedItems = (yield Promise.all(
        itemShareIds.map(
            async (shareId): Promise<ItemsByShareId> => ({
                [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
            })
        )
    )) as ItemsByShareId[];

    /**
     * Exclude the deleted shares from the cached shares
     * and merge with the new shares
     */
    const shares = cachedShares.filter(({ shareId }) => !deletedShareIds.includes(shareId)).concat(synced);

    return {
        shares: toMap(shares, 'shareId'),
        items: fullMerge(itemState, syncedItems.reduce(diadic(merge), {})),
    };
}
