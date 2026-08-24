import { call, put, select } from 'redux-saga/effects';

import { toMap } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import {
    itemsDeleteEvent,
    itemsUpdated,
    itemsUsedEvent,
    shareDeleted,
    shareEvent,
    shareEventUpdate,
    sharesEventNew,
    sharesEventSync,
} from '../../../store/actions';
import type { ItemsByShareId, ShareItem, SharesState } from '../../../store/reducers';
import { refreshUserData } from '../../../store/sagas/events/core/channel.core';
import { selectShare } from '../../../store/selectors';
import type { RootSagaOptions } from '../../../store/types';
import type { ItemRevision, Maybe, PassEventListResponse, Share, ShareGetResponse, ShareId } from '../../../types';
import { truthy } from '../../../utils/fp/predicates';
import { diadic } from '../../../utils/fp/variadics';
import { logId, logger } from '../../../utils/logger';
import { merge } from '../../../utils/object/merge';
import { PassCrypto } from '../../crypto';
import { parseItemRevision } from '../../items/item.parser';
import { requestItemsForShareId } from '../../items/item.requests';
import { parseShareResponse } from '../../shares/share.parser';
import { hasShareChanged } from '../../shares/share.predicates';
import { requestShare } from '../../shares/share.requests';
import { discardDrafts } from '../common/drafts';
import type { EventProcessor } from '../types';

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
    if (itemsMutated) yield onItemsUpdated?.();

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
export function* processSharesIncomingEvent(
    event: ShareGetResponse[],
    options?: RootSagaOptions
): Generator<any, Share[]> {
    logger.info(`[Polling::Shares]`, `${event.length} remote share(s) not in cache`);

    let encryptedShares: Maybe<Share>[] = yield Promise.all(event.map((s) => parseShareResponse(s)));

    /** If a group share failed to decrypt, refresh user data (addresses + keys)
     * and retry. This can happen when a member is added later to an existing
     * group, granting them a new address key needed to decrypt the share. */
    const groupShareFailed = event.some((share, idx) => !encryptedShares[idx] && Boolean(share.GroupID));
    if (groupShareFailed && options) {
        const keyPassword = options.getAuthStore().getPassword();
        if (keyPassword) {
            yield call(refreshUserData, options.extensionId, keyPassword);
            encryptedShares = yield Promise.all(
                event.map((share, idx) =>
                    encryptedShares[idx] ? Promise.resolve(encryptedShares[idx]) : parseShareResponse(share)
                )
            );
        }
    }

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
