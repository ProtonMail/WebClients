import { call, select } from 'redux-saga/effects';

import { toMap } from '@proton/shared/lib/helpers/object';

import { asIfNotOptimistic } from '../../../store/optimistic/selectors/select-is-optimistic';
import type { VaultShareItem } from '../../../store/reducers';
import { type ItemsByShareId, type SharesState, reducerMap } from '../../../store/reducers';
import type { ShareDedupeState } from '../../../store/reducers/shares-dedupe';
import { selectAllShares } from '../../../store/selectors';
import type { RootSagaOptions, State } from '../../../store/types';
import type { Maybe, Share, ShareGetResponse } from '../../../types';
import { partition } from '../../../utils/array/partition';
import { prop } from '../../../utils/fp/lens';
import { pipe } from '../../../utils/fp/pipe';
import { not, notIn } from '../../../utils/fp/predicates';
import { sortOn } from '../../../utils/fp/sort';
import { diadic } from '../../../utils/fp/variadics';
import { logger } from '../../../utils/logger';
import { partialMerge } from '../../../utils/object/merge';
import { PassCrypto } from '../../crypto';
import { requestItemsForShareId } from '../../items/item.requests';
import { dedupeShares } from '../../shares/share.dedupe';
import { parseShareResponse } from '../../shares/share.parser';
import { requestShares } from '../../shares/share.requests';
import { createDefaultVault } from '../common/vaults';
import { notifyInactiveShares } from '../notifications';
import { SyncStrategy } from '../types';

export type SyncResultV1 = {
    shares: SharesState;
    items: ItemsByShareId;
    dedupe: ShareDedupeState;
    v: 1;
};

export function* syncV1({ getCore }: RootSagaOptions): Generator<any, SyncResultV1> {
    const state: State = asIfNotOptimistic((yield select()) as State, reducerMap);
    const cachedShares = selectAllShares(state);
    const remote = ((yield requestShares()) as ShareGetResponse[]).sort(sortOn('CreateTime', 'ASC'));

    /* `cachedShareIds`: all shares currently in local cache
     * `inactiveCachedShareIds` : cached shares which can no longer be opened
     * `remoteShareIds` : all shares available server-side
     * `deletedShareIds` : local shares which have been deleted
     * `disabledShareIds` : `deletedShareIds` + `inactiveCachedShareIds` */
    const cachedShareIds = cachedShares.map(prop('shareId'));
    const inactiveCachedShareIds = cachedShareIds.filter(not(PassCrypto.canOpenShare));
    const remoteShareIds = remote.map(prop('ShareID'));
    const deletedShareIds = cachedShareIds.filter(notIn(remoteShareIds));
    const disabledShareIds = Array.from(new Set(deletedShareIds.concat(inactiveCachedShareIds)));

    type RemoteShare = { shareId: string; share: Maybe<Share> };

    /* only load shares that are not currently present
     * in cache and have not been registered on PassCrypto.
     * Share loading may fail if the userkey it was encrypted
     * with is inactive */
    const remoteShares = (yield Promise.all(
        remote
            .filter(pipe(prop('ShareID'), notIn(cachedShareIds)))
            .map(async (encryptedShare): Promise<RemoteShare> => ({
                shareId: encryptedShare.ShareID,
                /** Force `LEGACY` so per-share `eventIds` are always resolved: a V1
                 * sync needs them even when the ambient `SYNC_STRATEGY` is still
                 * `USER_EVENTS` during a V2→V1 rollback, before commit. */
                share: await parseShareResponse(encryptedShare, { strategy: SyncStrategy.LEGACY }),
            }))
    )) as RemoteShare[];

    /* Split active from inactive shares : if share is not defined
     * it means the decryption failed and as such is considered inactive. */
    const [activeRemoteShares, inactiveRemoteShares] = partition(remoteShares, ({ share }) => Boolean(share));

    /* update the disabled shareIds list with any inactive remote shares */
    disabledShareIds.push(...inactiveRemoteShares.map(prop('shareId')));

    if (inactiveRemoteShares.length > 0) yield call(notifyInactiveShares);

    /* when checking the presence of an active vault we must both
     * check the active remote shares and the local cached shares */
    const incomingShares = activeRemoteShares.map(prop('share')) as Share[];
    const defaultVault: Maybe<VaultShareItem> = yield call(createDefaultVault, incomingShares.concat(cachedShares));
    if (defaultVault) incomingShares.push(defaultVault);

    logger.info(`[Sync] Discovered ${cachedShareIds.length} share(s) in cache`);
    logger.info(`[Sync] User has ${remote.length} share(s) in database`);
    logger.info(`[Sync] ${deletedShareIds.length} share(s) deleted`);
    logger.info(`[Sync] ${inactiveRemoteShares.length} inactive remote share(s)`);
    logger.info(`[Sync] ${incomingShares.length} new share(s) to sync`);

    const itemShareIds = remoteShareIds.filter(notIn(disabledShareIds));

    const syncedItems = (yield Promise.all(
        itemShareIds.map(async (shareId): Promise<ItemsByShareId> => ({
            [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
        }))
    )) as ItemsByShareId[];

    /* Exclude the deleted shares from the cached shares
     * and merge with the new shares */
    const shares = cachedShares.filter(({ shareId }) => !disabledShareIds.includes(shareId)).concat(incomingShares);

    const result: SyncResultV1 = {
        v: 1,
        shares: toMap(shares, 'shareId'),
        dedupe: yield dedupeShares(shares, getCore()),
        items: syncedItems.reduce<ItemsByShareId>(diadic(partialMerge), {}),
    };

    return result;
}
