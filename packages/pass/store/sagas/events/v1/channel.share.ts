import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, call, cancel, fork, select, take } from 'redux-saga/effects';

import { isShareRemovedError } from '../../../../lib/api/errors';
import type { EventManagerEvent } from '../../../../lib/events/manager';
import { PendingFileLinkTracker } from '../../../../lib/file-attachments/file-link.tracker';
import { getItemKey } from '../../../../lib/items/item.utils';
import { getShareEventsQuery, getShareLatestEventId } from '../../../../lib/shares/share.requests';
import { processSharePollingError, processSharePollingEvent } from '../../../../lib/sync/v1/share-polling.processor';
import type { Api, Maybe, PassEventListResponse, Share } from '../../../../types';
import { logId, logger } from '../../../../utils/logger';
import { vaultDeleteSuccess } from '../../../actions';
import type { ShareItem } from '../../../reducers/shares';
import { selectAllShares, selectShare } from '../../../selectors';
import type { RootSagaOptions } from '../../../types';
import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel } from './types';

export type ShareEventResponse = { Events: PassEventListResponse };

/** Channel wrapper for per-share events. Handles channel-specific concerns
 * (pending file-link guard with `manager.setEventID`) then delegates core
 * processing to `processSharePollingEvent`. */
const onShareEvent = (shareId: string) =>
    function* (event: EventManagerEvent<ShareEventResponse>, channel: EventChannel<ShareEventResponse>, options: RootSagaOptions) {
        if ('error' in event) throw event.error;

        /** Edge-case: We might receive the update event from the BE before a file
         * linking operation has completed processing. To avoid inconsistencies between
         * optimistic updates and server events, we skip processing the entire event
         * batch if any item has a pending file link operation. */
        const { UpdatedItems } = event.Events;
        const currentEventId = ((yield select(selectShare(shareId))) as Maybe<ShareItem>)?.eventId;

        if (UpdatedItems.length > 0) {
            const updateIsPendingFileLink = UpdatedItems.some(({ ItemID: itemId }) => {
                const itemKey = getItemKey({ shareId, itemId });
                return PendingFileLinkTracker.isPending(itemKey);
            });

            if (updateIsPendingFileLink) {
                logger.info(`[Polling::Share::${logId(shareId)}] Skipped because of pending file link`);
                channel.manager.setEventID(currentEventId);
                return;
            }
        }

        yield call(processSharePollingEvent, shareId, event, options);
    };

const onShareEventError = (shareId: string, tasks: () => Task) =>
    function* (error: unknown, { channel }: EventChannel<ShareEventResponse>) {
        if (isShareRemovedError(error)) {
            logger.info(`[Polling::Share::${logId(shareId)}] share disabled`);
            channel.close();
            yield call(processSharePollingError, shareId);
            yield cancel(tasks());
        }
    };

const onShareDeleted = (shareId: string, tasks: () => Task) =>
    function* ({ channel }: EventChannel<ShareEventResponse>): Generator {
        yield take((action: Action) => vaultDeleteSuccess.match(action) && action.payload.shareId === shareId);
        logger.info(`[Polling::Share::${logId(shareId)}] share deleted`);
        channel.close();
        yield call(processSharePollingError, shareId);
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
        query: (latestEventID) => getShareEventsQuery(shareId, latestEventID),
        getCursor: ({ Events }) => ({ EventID: Events.LatestEventID, More: Events.EventsPending }),
        getLatestEventID: () => getShareLatestEventId(shareId),
        onClose: () => logger.info(`[Polling::Share::${logId(shareId)}] closing channel`),
        onEvent: onShareEvent(shareId),
        onError: onShareEventError(shareId, tasks),
    });

export const getShareChannelForks = (api: Api, options: RootSagaOptions) =>
    function* (share: Share) {
        logger.info(`[Polling::Share::${logId(share.shareId)}] start polling`);

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
