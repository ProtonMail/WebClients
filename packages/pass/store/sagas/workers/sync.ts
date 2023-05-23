import { put } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import type { Maybe } from '@proton/pass/types';
import { type Share, type ShareGetResponse, ShareType } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { partition } from '@proton/pass/utils/array';
import { and, invert, notIn, pipe, prop } from '@proton/pass/utils/fp';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { fullMerge, merge, objectFilter } from '@proton/pass/utils/object';
import { toMap } from '@proton/shared/lib/helpers/object';

import { notification } from '../../actions';
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
    FULL = 'full' /* fetches all items */,
    PARTIAL = 'partial' /* fetches only diff */,
}

const isActiveVault = ({ targetType, shareId }: Share) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

const isPrimaryVault = ({ targetType, primary }: Share) => targetType === ShareType.Vault && primary;

export function* synchronize(
    state: State,
    type: SyncType,
    { onShareEventDisabled }: WorkerRootSagaOptions
): Generator<unknown, SynchronizationResult> {
    const cachedShares = selectAllShares(state);
    const remote = ((yield requestShares()) as ShareGetResponse[]).sort(sortOn('CreateTime', 'ASC'));
    const primaryShareId = remote.find(({ Primary }) => Primary === true)?.ShareID;

    /* `cachedShareIds`: all shares currently in local cache
     * `inactiveCachedShareIds` : cached shares which can no longer be opened
     * `remoteShareIds` : all shares available server-side
     * `deletedShareIds` : local shares which have been deleted
     * `disabledShareIds` : `deletedShareIds` + `inactiveCachedShareIds` */
    const cachedShareIds = cachedShares.map(prop('shareId'));
    const inactiveCachedShareIds = cachedShareIds.filter(invert(PassCrypto.canOpenShare));
    const remoteShareIds = remote.map(prop('ShareID'));
    const deletedShareIds = cachedShareIds.filter(notIn(remoteShareIds));
    const disabledShareIds = Array.from(new Set(deletedShareIds.concat(inactiveCachedShareIds)));

    /* notify clients of any disabled shares */
    disabledShareIds.forEach((shareId) => onShareEventDisabled?.(shareId));

    /* only load shares that are not currently present
     * in cache and have not been registered on PassCrypto.
     * Share loading may fail if the userkey it was encrypted
     * with is inactive */
    const remoteShares = (yield Promise.all(
        remote.filter(pipe(prop('ShareID'), notIn(cachedShareIds))).map(async (share) => ({
            shareId: share.ShareID,
            share: await loadShare(share.ShareID, share.TargetType),
        }))
    )) as { shareId: string; share: Maybe<Share> }[];

    /* split active from inactive shares */
    const [activeRemoteShares, inactiveRemoteShares] = partition(remoteShares, ({ share }) => Boolean(share));
    const totalInactiveShares = inactiveRemoteShares.length + inactiveCachedShareIds.length;

    /* update the disabled shareIds list with any inactive remote shares */
    disabledShareIds.push(...inactiveRemoteShares.map(prop('shareId')));

    if (totalInactiveShares > 0) {
        yield put(
            notification({
                receiver: 'popup',
                type: 'error',
                expiration: -1,
                key: NotificationKey.INACTIVE_SHARES,
                text: '',
            })
        );
    }

    /* when checking the presence of an active vault we must both
     * check the active remote shares and the local cached shares */
    const incomingShares = activeRemoteShares.map(prop('share')) as Share[];
    const incomingShareIds = incomingShares.map(prop('shareId'));
    const hasActivePrimaryVault = incomingShares.concat(cachedShares).some(and(isActiveVault, isPrimaryVault));

    /* On first login or if the user's primary vault has been disabled
     * we need to (re-)create the primary vault share */
    if (!hasActivePrimaryVault) {
        logger.info(`[Saga::Sync] No primary vault found, creating primary vault..`);
        incomingShares.push(
            (yield createVault({
                content: { name: 'Personal', description: 'Personal vault', display: {} },
                primary: true,
            })) as Share<ShareType.Vault>
        );
    }

    logger.info(`[Saga::Sync] Discovered ${cachedShareIds.length} share(s) in cache`);
    logger.info(`[Saga::Sync] User has ${remote.length} share(s) in database`);
    logger.info(`[Saga::Sync] ${deletedShareIds.length} share(s) deleted`);
    logger.info(`[Saga::Sync] User has ${totalInactiveShares} total inactive share(s)`);
    logger.info(`[Saga::Sync] ${incomingShares.length} share(s) need to be synced`);
    logger.info(`[Saga::Sync] Performing ${type} sync`);

    /* On full sync : we want to request all items for each share
     * On partial sync : only request items for new shares (event-loop
     * will take care of updates) and remove items from deleted shares */
    const fullSync = type === SyncType.FULL;
    const itemShareIds = (fullSync ? remoteShareIds : incomingShareIds).filter(notIn(disabledShareIds));
    const itemState = fullSync ? {} : objectFilter(selectItems(state), notIn(disabledShareIds));

    const syncedItems = (yield Promise.all(
        itemShareIds.map(
            async (shareId): Promise<ItemsByShareId> => ({
                [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
            })
        )
    )) as ItemsByShareId[];

    /* Exclude the deleted shares from the cached shares
     * and merge with the new shares */
    const shares = cachedShares
        .filter(({ shareId }) => !disabledShareIds.includes(shareId))
        .concat(incomingShares)
        .map((share) => ({ ...share, primary: share.shareId === primaryShareId }));

    return {
        shares: toMap(shares, 'shareId'),
        items: fullMerge(itemState, syncedItems.reduce(diadic(merge), {})),
    };
}
