import { put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import type { EventProcessor } from '@proton/pass/lib/events/types';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { hasShareChanged } from '@proton/pass/lib/shares/share.predicates';
import { requestShare } from '@proton/pass/lib/shares/share.requests';
import {
    itemsDeleteEvent,
    itemsUpdated,
    itemsUsedEvent,
    shareDeleted,
    shareEvent,
    shareEventUpdate,
    sharesEventNew,
    sharesEventSync,
} from '@proton/pass/store/actions';
import type { ItemsByShareId, ShareItem, SharesState } from '@proton/pass/store/reducers';
import { discardDrafts } from '@proton/pass/store/sagas/items/item-drafts';
import { selectShare } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, Maybe, PassEventListResponse, Share, ShareGetResponse, ShareId } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logId, logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

export type SharePollingEvent = { Events: PassEventListResponse };

/** Processes a single share's polling event: decrypts items, syncs share
 * metadata, handles deletions and last-use timestamps. Pure processing logic
 * with no channel/EventManager dependencies — channel-specific concerns
 * (pending file-link guard, `manager.setEventID`) remain in `channel.share.ts`.
 * Called both from V1 legacy channels and imperatively during migration. */
export function* processSharePollingEvent(
    shareId: ShareId,
    event: SharePollingEvent,
    { onItemsUpdated }: RootSagaOptions
): EventProcessor {
    const { Events } = event;
    const { LatestEventID: eventId, DeletedItemIDs, UpdatedItems, UpdatedShare, LastUseItems, FullRefresh } = Events;
    const currentEventId = ((yield select(selectShare(shareId))) as Maybe<ShareItem>)?.eventId;

    /* dispatch only if there was a change */
    if (currentEventId !== eventId) {
        logger.info(`[Polling::Share::${logId(shareId)}] event ${logId(eventId)}`);
        yield put(shareEvent({ ...event, shareId }));
    }

    if (UpdatedShare) {
        const share: Maybe<Share> = yield parseShareResponse(UpdatedShare, { eventId });
        if (share) yield put(shareEventUpdate(share));
    }

    /** Discard drafts before dispatching the delete action: the item
     * may be selected in the pop-up and we need to clear the draft
     * side-effect before removing the data from the store. */
    if (DeletedItemIDs.length > 0) {
        yield discardDrafts(shareId, DeletedItemIDs);
        yield put(itemsDeleteEvent(shareId, DeletedItemIDs));
    }

    if (LastUseItems && LastUseItems.length > 0) {
        yield put(
            itemsUsedEvent(
                LastUseItems.map(({ ItemID, LastUseTime }) => ({
                    itemId: ItemID,
                    shareId,
                    lastUseTime: LastUseTime,
                }))
            )
        );
    }

    if (UpdatedItems.length > 0) {
        const updatedItems = (
            (yield Promise.all(
                UpdatedItems.map((encryptedItem) => parseItemRevision(shareId, encryptedItem).catch(noop))
            )) as Maybe<ItemRevision>[]
        ).filter(truthy);

        yield put(itemsUpdated(updatedItems));
    }

    if (FullRefresh) {
        const encryptedShare: ShareGetResponse = yield requestShare(shareId);
        const share: Maybe<Share> = yield parseShareResponse(encryptedShare);

        if (share) {
            yield put(shareEventUpdate(share));
            const updatedItems: ItemRevision[] = yield requestItemsForShareId(shareId);
            yield put(itemsUpdated(updatedItems));
        }
    }

    const itemsMutated = DeletedItemIDs.length + UpdatedItems.length > 0 || FullRefresh;
    if (itemsMutated) onItemsUpdated?.();

    return true;
}

/** Compares remote shares against local state and dispatches `sharesEventSync`
 * for any share whose properties changed. The caller is responsible for detecting
 * new shares (not in `localShares`). */
export function* processSharesPollingEvent(remoteShares: ShareGetResponse[], localShares: SharesState): EventProcessor {
    for (const encryptedShare of remoteShares) {
        const shareId = encryptedShare.ShareID;
        const match = localShares[shareId];

        if (match && hasShareChanged(match, encryptedShare)) {
            const share: Maybe<Share> = yield parseShareResponse(encryptedShare, { eventId: match.eventId });
            if (share) yield put(sharesEventSync(share));
        }
    }

    return true;
}

/** Processes newly discovered remote shares: parses, fetches their items,
 * and dispatches `sharesEventNew`. Returns the active parsed shares so the
 * caller can decide how to handle them (V1: fork per-share channels,
 * migration: no-op) */
export function* processSharesIncomingEvent(event: ShareGetResponse[]): Generator<any, Share[]> {
    logger.info(`[Polling::Shares]`, `${event.length} remote share(s) not in cache`);

    const encryptedShares: Maybe<Share>[] = yield Promise.all(event.map((s) => parseShareResponse(s)));
    const shares = encryptedShares.filter(truthy);

    if (shares.length === 0) return [];

    const items: ItemsByShareId[] = yield Promise.all(
        shares.map(async ({ shareId }): Promise<ItemsByShareId> => {
            const items = await requestItemsForShareId(shareId);
            return { [shareId]: toMap(items, 'itemId') };
        })
    );

    yield put(
        sharesEventNew({
            shares: toMap(shares, 'shareId'),
            items: items.reduce(diadic(merge)),
            v: 1,
        })
    );

    return shares;
}

export function* processSharePollingError(shareId: string) {
    const share: Maybe<Share> = yield select(selectShare(shareId));
    if (share) yield put(shareDeleted(share));
    PassCrypto.removeShare(shareId);
    yield discardDrafts(shareId);
}
