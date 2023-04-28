/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select, takeEvery } from 'redux-saga/effects';

import type { Api, Maybe, ServerEvent, Share, SharesGetResponse } from '@proton/pass/types';
import { ChannelType, ShareType } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';

import { sharesSync, vaultCreationSuccess } from '../../actions';
import { ItemsByShareId } from '../../reducers';
import { selectAllShares } from '../../selectors';
import type { WorkerRootSagaOptions } from '../../types';
import { requestItemsForShareId } from '../workers/items';
import { loadShare } from '../workers/shares';
import { eventChannelFactory } from './channel.factory';
import { getShareChannelForks } from './channel.share';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

/* We're only interested in new shares in this effect :
 * deleted shares will be handled by the share's EventChannel
 * error handling. see `channel.share.ts` code `300004`
 * FIXME: handle ItemShares */
function* onSharesEvent(
    event: ServerEvent<ChannelType.SHARES>,
    { api }: EventChannel<ChannelType.SHARES>,
    options: WorkerRootSagaOptions
) {
    if (event.error) throw event.error;

    const localShares: Share[] = yield select(selectAllShares);
    const localShareIds = localShares.map(({ shareId }) => shareId);

    const newShares = event.Shares.filter((share) => !localShareIds.includes(share.ShareID));
    logger.info(`[Saga::SharesChannel]`, `${newShares.length} remote share(s) not in cache`);

    if (newShares.length) {
        const shares = (
            (yield Promise.all(
                newShares
                    .filter((share) => share.TargetType === ShareType.Vault)
                    .map(({ ShareID }) => loadShare(ShareID, ShareType.Vault))
            )) as Maybe<Share>[]
        ).filter(truthy);

        if (shares.length > 0) {
            const items = (
                (yield Promise.all(
                    shares.map(async ({ shareId }) => ({
                        [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
                    }))
                )) as ItemsByShareId[]
            ).reduce(diadic(merge));

            yield put(sharesSync({ shares: toMap(shares, 'shareId'), items }));
            yield all(shares.map(getShareChannelForks(api, options)).flat());
        }
    }
}

const NOOP_EVENT = '*';

/* The event-manager can be used to implement
 * a polling mechanism if we conform to the data
 * structure it is expecting. In order to poll for
 * new shares, set the query accordingly & use a
 * non-existing eventID */
export const createSharesChannel = (api: Api) =>
    eventChannelFactory<ChannelType.SHARES>({
        api,
        type: ChannelType.SHARES,
        interval: INTERVAL_EVENT_TIMER,
        eventID: NOOP_EVENT,
        onClose: () => logger.info(`[Saga::SharesChannel] closing channel`),
        onEvent: onSharesEvent,
        query: () => ({
            url: 'pass/v1/share',
            method: 'get',
            mapResponse: (response: SharesGetResponse) => ({
                ...response,
                EventID: NOOP_EVENT,
                More: false,
            }),
        }),
    });

/* when a vault is created : recreate all the necessary
 * channels to start polling for this new share's events */
function* onNewShare(api: Api, options: WorkerRootSagaOptions) {
    yield takeEvery(vaultCreationSuccess.match, function* ({ payload: { share } }) {
        yield all(getShareChannelForks(api, options)(share));
    });
}

export function* sharesChannel(api: Api, options: WorkerRootSagaOptions) {
    logger.info(`[Saga::SharesChannel] start polling for new shares`);
    const eventsChannel = createSharesChannel(api);
    const events = fork(channelEventsWorker<ChannelType.SHARES>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<ChannelType.SHARES>, eventsChannel);
    const newVault = fork(onNewShare, api, options);

    yield all([events, wakeup, newVault]);
}
