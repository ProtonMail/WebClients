import { call, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { dedupeShares } from '@proton/pass/lib/shares/share.dedupe';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { notifyInactiveShares } from '@proton/pass/lib/sync/migrate';
import { isActiveVault, isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import { asIfNotOptimistic } from '@proton/pass/store//optimistic/selectors/select-is-optimistic';
import { type ItemsByShareId, type SharesState, reducerMap } from '@proton/pass/store/reducers';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import { selectAllShares, selectOrganizationVaultCreationPolicy } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import {
    type Maybe,
    OrganizationVaultCreateMode,
    type Share,
    type ShareGetResponse,
    type ShareType,
} from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { and, not, notIn } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

export type SyncResultV1 = {
    shares: SharesState;
    items: ItemsByShareId;
    dedupe: ShareDedupeState;
    v: 1;
};

export function* syncV1({ getCore }: RootSagaOptions) {
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
        remote.filter(pipe(prop('ShareID'), notIn(cachedShareIds))).map(
            async (encryptedShare): Promise<RemoteShare> => ({
                shareId: encryptedShare.ShareID,
                share: await parseShareResponse(encryptedShare),
            })
        )
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
    const hasDefaultVault = incomingShares.concat(cachedShares).some(and(isActiveVault, isWritableVault, isOwnVault));

    /* When syncing, if no owned writable vault exists, create it.
     * For b2b users, don't create vault if org doesn't allow it.
     * This accounts for first login, default vault being disabled. */
    if (!hasDefaultVault) {
        const canCreateVault =
            selectOrganizationVaultCreationPolicy(state) !== OrganizationVaultCreateMode.ONLYORGADMINS;

        if (canCreateVault) {
            logger.info(`[Sync] No default vault found, creating initial vault..`);
            const defaultVault: Share<ShareType.Vault> = yield createVault({
                content: {
                    name: 'Personal',
                    description: 'Personal vault',
                    display: {},
                },
            });

            incomingShares.push(defaultVault);
        } else {
            logger.info(`[Sync] No default vault found, cannot create one due to organization policy.`);
        }
    }

    logger.info(`[Sync] Discovered ${cachedShareIds.length} share(s) in cache`);
    logger.info(`[Sync] User has ${remote.length} share(s) in database`);
    logger.info(`[Sync] ${deletedShareIds.length} share(s) deleted`);
    logger.info(`[Sync] ${inactiveRemoteShares.length} inactive remote share(s)`);
    logger.info(`[Sync] ${incomingShares.length} new share(s) to sync`);

    const itemShareIds = remoteShareIds.filter(notIn(disabledShareIds));

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

    const result: SyncResultV1 = {
        v: 1,
        shares: toMap(shares, 'shareId'),
        dedupe: yield dedupeShares(shares, getCore()),
        items: syncedItems.reduce<ItemsByShareId>(diadic(partialMerge), {}),
    };

    return result;
}
