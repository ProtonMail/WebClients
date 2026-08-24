import type { Action } from 'redux';
import { call, put, select } from 'redux-saga/effects';

import chunk from '@proton/utils/chunk';

import { MIN_MAX_BATCH_PER_REQUEST } from '../../../constants';
import { shareCreated, shareDeleted, shareUpdated } from '../../../store/actions';
import { refreshUserData } from '../../../store/sagas/events/core/channel.core';
import { selectShare } from '../../../store/selectors';
import type { RootSagaOptions } from '../../../store/types';
import type { Maybe, MaybeNull, Share, ShareCreatedDTO, ShareId, SyncEventShareOutput } from '../../../types';
import { prop } from '../../../utils/fp/lens';
import { isShareRemovedError } from '../../api/errors';
import { PassCrypto } from '../../crypto';
import { requestItemsForShareId } from '../../items/item.requests';
import { parseShareResponse } from '../../shares/share.parser';
import { requestShare } from '../../shares/share.requests';
import { discardDrafts } from '../common/drafts';
import type { EventProcessor } from '../types';

/** Fetches and decrypts a single share. `parseShareResponse` will
 * internally request share keys if not already in `PassCrypto`. */
export async function shareFetcher(shareId: ShareId): Promise<MaybeNull<Share>> {
    const encryptedShare = await requestShare(shareId);
    const share = await parseShareResponse(encryptedShare);
    return share ?? null;
}

/** Fetches a share along with all its items. Returns `null` if the
 * share itself cannot be resolved (decryption failure or not found). */
async function shareWithItemsFetcher(shareId: ShareId): Promise<MaybeNull<ShareCreatedDTO>> {
    const share = await shareFetcher(shareId);
    if (!share) return null;

    const items = await requestItemsForShareId(shareId);
    return { share, items };
}

/** Unconditionally cleans up crypto state and drafts for a share.
 * Dispatches `shareDeleted` only if the share exists in the store. */
function* onShareDeleted(shareId: ShareId) {
    const share: Maybe<Share> = yield select(selectShare(shareId));

    yield discardDrafts(shareId);
    PassCrypto.removeShare(shareId);
    if (share) yield put(shareDeleted(share));
}

/** Fetches shares in batches using the provided fetcher, dispatching an action
 * per resolved result. Null-resolved fetches (undecryptable shares) and
 * share-removed errors (phantom events referencing a deleted/disabled share)
 * are omitted from the dispatch but tolerated. Any other failed fetch flips the
 * result to `false` so the batch is retried on next poll. */
function* processShareBatches<T>(
    shares: SyncEventShareOutput[],
    fetcher: (shareId: ShareId) => Promise<MaybeNull<T>>,
    action: (value: T) => Action
): EventProcessor {
    let processed = true;

    for (const batch of chunk(shares, MIN_MAX_BATCH_PER_REQUEST)) {
        const results: PromiseSettledResult<MaybeNull<T>>[] = yield call(() =>
            Promise.allSettled(
                batch.map(({ ShareID }) =>
                    fetcher(ShareID).catch((err) => {
                        if (isShareRemovedError(err)) return;
                        throw err;
                    })
                )
            )
        );

        const resolved = results
            .filter((res): res is PromiseFulfilledResult<MaybeNull<T>> => res.status === 'fulfilled')
            .map(prop('value'));

        if (resolved.length < batch.length) processed = false;
        for (const value of resolved) if (value) yield put(action(value));
    }

    return processed;
}

/** Processes newly created shares in batches. For each share, fetches the share
 * details (with decryption) and all its items. The CS-restore edge-case (delete
 * then re-create) is handled at the reducer level: `shareCreated` wipes any
 * existing entry before merging, so stale local data never conflicts with freshly
 * fetched state. Returns `true` if all fetches succeeded. */
export function* processSharesCreated(created: SyncEventShareOutput[], options?: RootSagaOptions): EventProcessor {
    if (created.length === 0) return true;

    const ok: boolean = yield call(processShareBatches<ShareCreatedDTO>, created, shareWithItemsFetcher, shareCreated);

    /** If a created share failed to decrypt, refresh user data (addresses + keys)
     * and retry. This can happen when a member is added later to an existing
     * group, granting them a new address key needed to decrypt the share. */
    const unresolved = created.filter(({ ShareID }) => !PassCrypto.canOpenShare(ShareID));
    if (unresolved.length === 0 || !options) return ok;
    const keyPassword = options.getAuthStore().getPassword();
    if (!keyPassword) return ok;
    yield call(refreshUserData, options.extensionId, keyPassword);
    const retried: boolean = yield call(
        processShareBatches<ShareCreatedDTO>,
        unresolved,
        shareWithItemsFetcher,
        shareCreated
    );

    return ok && retried;
}

/** Processes share deletions by discarding drafts and removing share
 * data from the store. No-ops for shares not in local state. */
export function* processSharesDeleted(deleted: SyncEventShareOutput[]): EventProcessor {
    if (deleted.length === 0) return true;
    for (const { ShareID } of deleted) yield call(onShareDeleted, ShareID);
    return true;
}

/** Processes share updates in batches, re-fetching and decrypting each
 * share to get the latest metadata. Dispatches `shareUpdated` per share.
 * Returns `true` if all fetches succeeded. */
export function* processSharesUpdated(updated: SyncEventShareOutput[]): EventProcessor {
    if (updated.length === 0) return true;
    return yield call(processShareBatches<Share>, updated, shareFetcher, shareUpdated);
}
