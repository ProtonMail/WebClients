import { call, put, select } from 'redux-saga/effects';

import { MIN_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShare } from '@proton/pass/lib/shares/share.requests';
import { shareCreated, shareDeleted, shareUpdated } from '@proton/pass/store/actions';
import { discardDrafts } from '@proton/pass/store/sagas/items/item-drafts';
import { selectShare } from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull, Share, ShareCreatedDTO, ShareId, SyncEventShareOutput } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import chunk from '@proton/utils/chunk';

/** Fetches and decrypts a single share. `parseShareResponse` will
 * internally request share keys if not already in `PassCrypto`. */
async function shareFetcher(shareId: ShareId): Promise<MaybeNull<Share>> {
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

/** Async generator that fetches shares in parallel batches, yielding each
 * non-null result individually. Failed or null-resolved fetches are silently
 * omitted. Returns `true` if every fetch in every batch succeeded. */
async function* batchedShareFetcher<T>(
    output: SyncEventShareOutput[],
    fetcher: (shareID: ShareId) => Promise<T>
): AsyncGenerator<NonNullable<T>, boolean> {
    const batches = chunk(output, MIN_MAX_BATCH_PER_REQUEST);
    let processed = true;

    for (const batch of batches) {
        const results = await Promise.allSettled(batch.map(({ ShareID }) => fetcher(ShareID)));

        const data = results
            .filter((res): res is PromiseFulfilledResult<Awaited<T>> => res.status === 'fulfilled')
            .map(prop('value'));

        if (data.length < batch.length) processed = false;
        for (const value of data) if (value) yield value;
    }

    return processed;
}

/** Cleans up local state for a share if it exists: discards any
 * open drafts and dispatches `shareDeleted` to purge from store. */
function* onShareDeleted(shareId: ShareId) {
    const share: Maybe<Share> = yield select(selectShare(shareId));

    if (share) {
        yield discardDrafts(shareId);
        yield put(shareDeleted(share));
    }
}

/** Processes newly created shares in batches. For each share, fetches the
 * share details (with decryption) and all its items.
 *
 * NOTE: Before fetching, any existing local share data is purged via
 * `onShareDeleted`. This handles the edge-case where a user deletes a share
 * and CS restores it — stale local cache would otherwise conflict with the
 * freshly restored share. Returns `true` if all fetches succeeded. */
export function* processSharesCreated(created: SyncEventShareOutput[]): EventProcessor {
    if (created.length === 0) return true;

    for (const { ShareID } of created) yield call(onShareDeleted, ShareID);
    const fetcher = batchedShareFetcher(created, shareWithItemsFetcher);

    while (true) {
        const res: IteratorResult<ShareCreatedDTO, boolean> = yield call(() => fetcher.next());
        if (res.done) return res.value;
        yield put(shareCreated(res.value));
    }
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

    const fetcher = batchedShareFetcher(updated, shareFetcher);

    while (true) {
        const res: IteratorResult<Share, boolean> = yield call(() => fetcher.next());
        if (res.done) return res.value;
        yield put(shareUpdated(res.value));
    }
}
