import type { Channel } from 'redux-saga';
import { channel } from 'redux-saga';
import { all, call, cancelled, fork, select, take, takeEvery } from 'redux-saga/effects';

import { NOOP_EVENT } from '../../../../lib/events/manager';
import { getSharesQuery } from '../../../../lib/shares/share.requests';
import { processSharesIncomingEvent, processSharesPollingEvent } from '../../../../lib/sync/v1/share-polling.processor';
import type { Api, Share, ShareGetResponse, SharesGetResponse } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { vaultCreationSuccess } from '../../../actions';
import type { SharesState } from '../../../reducers';
import { selectShareState } from '../../../selectors';
import type { RootSagaOptions } from '../../../types';
import { eventChannelFactory } from './channel.factory';
import { getShareChannelForks } from './channel.share';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel, EventChannelOnEvent } from './types';

type SharesIncomingChannel = Channel<ShareGetResponse[]>;
type SharesChannels = { events: EventChannel<SharesGetResponse>; incoming: SharesIncomingChannel };

/** Channel wrapper for the shares-list polling event. Delegates changed-share
 * detection to `processSharesPollingEvent` (forked) and pushes newly discovered
 * shares to the incoming channel for `processSharesIncomingEvent` to handle.
 * Deleted shares are handled by per-share channel error handling (see
 * `channel.share.ts:onShareEventError`). */
const onSharesEventFactory = (incoming: SharesIncomingChannel): EventChannelOnEvent<SharesGetResponse> =>
    function* (event) {
        if ('error' in event) throw event.error;

        const shares: SharesState = yield select(selectShareState);
        yield fork(processSharesPollingEvent, event.Shares, shares);

        const newShares = event.Shares.filter((share) => !(share.ShareID in shares));
        if (newShares.length) yield incoming.put(newShares);
    };

/* The event-manager can be used to implement
 * a polling mechanism if we conform to the data
 * structure it is expecting. In order to poll for
 * new shares, set the query accordingly & use a
 * non-existing eventID */
export const createSharesChannel = (api: Api, newSharesChannel: SharesIncomingChannel) =>
    eventChannelFactory<SharesGetResponse>({
        api,
        channelId: 'shares',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        onClose: () => logger.info(`[Polling::Shares] closing channel`),
        onEvent: onSharesEventFactory(newSharesChannel),
        query: getSharesQuery,
    });

/** When a vault is created : recreate all the necessary
 * channels to start polling for this new share's events */
function* onShareCreated(api: Api, options: RootSagaOptions) {
    yield takeEvery(vaultCreationSuccess.match, function* ({ payload: { share } }) {
        yield getShareChannelForks(api, options)(share);
    });
}

export function* onSharesIncoming(incoming: SharesIncomingChannel, api: Api, options: RootSagaOptions): Generator {
    try {
        while (true) {
            const event: ShareGetResponse[] = yield take(incoming);
            const shares: Share[] = yield call(processSharesIncomingEvent, event, options);
            for (const share of shares) yield fork(getShareChannelForks(api, options), share);
        }
    } finally {
        if (yield cancelled()) incoming.close();
    }
}

export function* sharesChannel(
    api: Api,
    options: RootSagaOptions,
    deps?: SharesChannels // unit-testing purposes
): Generator {
    const incomingChannel = deps?.incoming ?? channel<ShareGetResponse[]>();
    const eventsChannel = deps?.events ?? createSharesChannel(api, incomingChannel);

    logger.info(`[Polling::Shares] start polling for new shares`);

    const events = fork(channelEvents<SharesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<SharesGetResponse>, eventsChannel, options);
    const shareCreated = fork(onShareCreated, api, options);
    const sharesIncoming = fork(onSharesIncoming, incomingChannel, api, options);

    yield all([events, wakeup, shareCreated, sharesIncoming]);
}
