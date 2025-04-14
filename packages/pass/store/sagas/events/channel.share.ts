/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, put, select, take } from 'redux-saga/effects';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import type { EventManagerEvent } from '@proton/pass/lib/events/manager';
import { PendingFileLinkTracker } from '@proton/pass/lib/file-attachments/file-link.tracker';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { getShareLatestEventId, requestShare } from '@proton/pass/lib/shares/share.requests';
import {
    itemsDeleteSync,
    itemsEditSync,
    itemsUsedSync,
    shareEvent,
    shareEventDelete,
    shareEventUpdate,
    vaultDeleteSuccess,
} from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers/shares';
import { selectAllShares, selectShare } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, ItemRevision, Maybe, PassEventListResponse, Share, ShareGetResponse } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import noop from '@proton/utils/noop';

import { discardDrafts } from '../items/item-drafts';
import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel } from './types';

export type ShareEventResponse = { Events: PassEventListResponse };

/* It is important to call onItemsDeleted before
 * actually dispatching the resulting action : we may be dealing
 * with a share or an item being selected in the pop-up and need
 * to run the side-effect before clearing the data from the store
 * FIXME: support ItemShares */
const onShareEvent = (shareId: string) =>
    function* (
        event: EventManagerEvent<ShareEventResponse>,
        channel: EventChannel<ShareEventResponse>,
        { onItemsUpdated }: RootSagaOptions
    ) {
        if ('error' in event) throw event.error;

        const { Events } = event;
        const {
            LatestEventID: eventId,
            DeletedItemIDs,
            UpdatedItems,
            UpdatedShare,
            LastUseItems,
            FullRefresh,
        } = Events;
        const currentEventId = ((yield select(selectShare(shareId))) as Maybe<ShareItem>)?.eventId;

        if (UpdatedItems.length > 0) {
            const updateIsPendingFileLink = UpdatedItems.some(({ ItemID: itemId }) => {
                const itemKey = getItemKey({ shareId, itemId });
                return PendingFileLinkTracker.isPending(itemKey);
            });

            if (updateIsPendingFileLink) {
                /** Edge-case: We might receive the update event from the BE before a file
                 * linking operation has completed processing. To avoid inconsistencies between
                 * optimistic updates and server events, we skip processing the entire event
                 * batch if any item has a pending file link operation. */
                logger.info(`[ServerEvents::Share::${logId(shareId)}] Skipped because of pending file link`);
                channel.manager.setEventID(currentEventId);
                return;
            }
        }

        /* dispatch only if there was a change */
        if (currentEventId !== eventId) {
            logger.info(`[ServerEvents::Share::${logId(shareId)}] event ${logId(eventId)}`);
            yield put(shareEvent({ ...event, shareId }));
        }

        if (UpdatedShare) {
            const share: Maybe<Share> = yield parseShareResponse(UpdatedShare, { eventId });
            if (share) yield put(shareEventUpdate(share));
        }

        if (DeletedItemIDs.length > 0) {
            yield discardDrafts(shareId, DeletedItemIDs);
            yield put(itemsDeleteSync(shareId, DeletedItemIDs));
        }

        if (LastUseItems && LastUseItems.length > 0) {
            yield put(
                itemsUsedSync(
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

            yield put(itemsEditSync(updatedItems));
        }

        if (FullRefresh) {
            const encryptedShare: ShareGetResponse = yield requestShare(shareId);
            const share: Maybe<Share> = yield parseShareResponse(encryptedShare);

            if (share) {
                yield put(shareEventUpdate(share));
                const updatedItems: ItemRevision[] = yield requestItemsForShareId(shareId);
                yield put(itemsEditSync(updatedItems));
            }
        }

        const itemsMutated = DeletedItemIDs.length + UpdatedItems.length > 0 || FullRefresh;
        if (itemsMutated) onItemsUpdated?.();
    };

const onShareEventError = (shareId: string, tasks: () => Task) =>
    function* (error: unknown, { channel }: EventChannel<ShareEventResponse>, { onItemsUpdated }: RootSagaOptions) {
        const { code } = getApiError(error);

        /* share was deleted or user lost access */
        if (code === PassErrorCode.DISABLED_SHARE || code === PassErrorCode.NOT_EXIST_SHARE) {
            logger.info(`[ServerEvents::Share::${logId(shareId)}] share disabled`);
            channel.close();
            const share: Maybe<Share> = yield select(selectShare(shareId));

            if (share) {
                onItemsUpdated?.();
                yield discardDrafts(shareId);
                yield put(shareEventDelete(share));
            }

            yield cancel(tasks());
        }
    };

const onShareDeleted = (shareId: string, tasks: () => Task) =>
    function* ({ channel }: EventChannel<ShareEventResponse>): Generator {
        yield take((action: Action) => vaultDeleteSuccess.match(action) && action.payload.shareId === shareId);
        logger.info(`[ServerEvents::Share::${logId(shareId)}] share deleted`);
        channel.close();
        yield discardDrafts(shareId);
        yield cancel(tasks());
    };

/* We need to lift the response to the correct data
 * structure by leveraging ApiOptions::mapResponse
 * (see type definition and create-api.ts for specs) */
export const createShareChannel = (api: Api, { shareId, eventId }: Share, tasks: () => Task) =>
    eventChannelFactory<ShareEventResponse>({
        api,
        channelId: `share::${shareId}`,
        initialEventID: eventId,
        query: (eventId) => ({ url: `pass/v1/share/${shareId}/event/${eventId}`, method: 'get' }),
        getCursor: ({ Events }) => ({ EventID: Events.LatestEventID, More: Events.EventsPending }),
        getLatestEventID: () => getShareLatestEventId(shareId),
        onClose: () => logger.info(`[ServerEvents::Share::${logId(shareId)}] closing channel`),
        onEvent: onShareEvent(shareId),
        onError: onShareEventError(shareId, tasks),
    });

export const getShareChannelForks = (api: Api, options: RootSagaOptions) =>
    function* (share: Share) {
        logger.info(`[ServerEvents::Share::${logId(share.shareId)}] start polling`);

        const tasks: Task = yield fork(function* () {
            const self = () => tasks;
            const eventsChannel = createShareChannel(api, share, self);
            const events = fork(channelEvents<ShareEventResponse>, eventsChannel, options);
            const wakeup = fork(channelInitalize<ShareEventResponse>, eventsChannel, options);
            const onDelete = fork(onShareDeleted(share.shareId, self), eventsChannel);

            yield all([events, wakeup, onDelete]);
        });

        return tasks;
    };

export function* shareChannels(api: Api, options: RootSagaOptions) {
    const shares = (yield select(selectAllShares)) as Share[];
    yield all(shares.map(getShareChannelForks(api, options)));
}
