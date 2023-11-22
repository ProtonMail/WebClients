import { put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import { asIfNotOptimistic } from '@proton/pass/store//optimistic/selectors/select-is-optimistic';
import { notification } from '@proton/pass/store/actions';
import { type ItemsByShareId, type SharesState, reducerMap } from '@proton/pass/store/reducers';
import { selectAllShares, selectItems } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { type Share, type ShareGetResponse, ShareType } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { and, invert, notIn } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { fullMerge, merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

export type SynchronizationOptions = { type: SyncType; allowFailure?: boolean };
export type SynchronizationResult = { shares: SharesState; items: ItemsByShareId };

export enum SyncType {
    FULL = 'full' /* fetches all items */,
    PARTIAL = 'partial' /* fetches only diff */,
}

const isActiveVault = <T extends Share>({ targetType, shareId }: T) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

export function* synchronize(options: SynchronizationOptions, { onShareEventDisabled }: WorkerRootSagaOptions) {
    try {
        const state: State = asIfNotOptimistic((yield select()) as State, reducerMap);
        const cachedShares = selectAllShares(state);
        const remote = ((yield requestShares()) as ShareGetResponse[]).sort(sortOn('CreateTime', 'ASC'));

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
            remote.filter(pipe(prop('ShareID'), notIn(cachedShareIds))).map(async (encryptedShare) => ({
                shareId: encryptedShare.ShareID,
                share: await parseShareResponse(encryptedShare),
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
                    endpoint: 'popup',
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
        const hasDefaultVault = incomingShares
            .concat(cachedShares)
            .some(and(isActiveVault, isWritableVault, isOwnVault));

        /* When syncing, if no owned writable vault exists, create it. This
         * accounts for first login, default vault being disabledl. */
        if (!hasDefaultVault) {
            logger.info(`[Saga::Sync] No default vault found, creating initial vault..`);
            const defaultVault: Share<ShareType.Vault> = yield createVault({
                content: {
                    name: 'Personal',
                    description: 'Personal vault',
                    display: {},
                },
            });

            incomingShares.push(defaultVault);
        }

        logger.info(`[Saga::Sync] Discovered ${cachedShareIds.length} share(s) in cache`);
        logger.info(`[Saga::Sync] User has ${remote.length} share(s) in database`);
        logger.info(`[Saga::Sync] ${deletedShareIds.length} share(s) deleted`);
        logger.info(`[Saga::Sync] User has ${totalInactiveShares} total inactive share(s)`);
        logger.info(`[Saga::Sync] ${incomingShares.length} share(s) need to be synced`);
        logger.info(`[Saga::Sync] Performing ${options.type} sync`);

        /* On full sync : we want to request all items for each share
         * On partial sync : only request items for new shares (event-loop
         * will take care of updates) and remove items from deleted shares */
        const fullSync = options.type === SyncType.FULL;
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
        const shares = cachedShares.filter(({ shareId }) => !disabledShareIds.includes(shareId)).concat(incomingShares);

        const result: SynchronizationResult = {
            shares: toMap(shares, 'shareId'),
            items: fullMerge(itemState, syncedItems.reduce(diadic(merge), {})),
        };

        return result;
    } catch (err) {
        if (!options.allowFailure) throw err;
    }
}
