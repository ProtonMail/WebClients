/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select, takeEvery } from 'redux-saga/effects';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/events/constants';
import type { Api, Maybe, Share, SharesGetResponse } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import type { PendingInvite, ShareMember } from '@proton/pass/types/data/invites';
import { prop, truthy } from '@proton/pass/utils/fp';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { type EventManagerEvent, NOOP_EVENT } from '../../../events/manager';
import {
    sharesSync,
    syncShareInvites,
    syncShareMembers,
    vaultCreationSuccess,
    vaultSetPrimarySync,
} from '../../actions';
import type { ItemsByShareId } from '../../reducers';
import { selectAllShares } from '../../selectors';
import type { WorkerRootSagaOptions } from '../../types';
import { loadPendingShareInvites } from '../workers/invite';
import { requestItemsForShareId } from '../workers/items';
import { loadShare, loadShareMembers } from '../workers/shares';
import { eventChannelFactory } from './channel.factory';
import { getShareChannelForks } from './channel.share';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

/* We're only interested in new shares in this effect :
 * deleted shares will be handled by the share's EventChannel
 * error handling. see `channel.share.ts` code `300004`
 * FIXME: handle ItemShares */
function* onSharesEvent(
    event: EventManagerEvent<SharesGetResponse>,
    { api }: EventChannel<any>,
    options: WorkerRootSagaOptions
) {
    if ('error' in event) throw event.error;

    const localShares: Share[] = yield select(selectAllShares);
    const localPrimaryShareId = localShares.find(prop('primary'))?.shareId;
    const localShareIds = localShares.map(({ shareId }) => shareId);

    const remoteShares = event.Shares;
    const remotePrimaryShareId = remoteShares.find(prop('Primary'))?.ShareID;

    // DO NOT MERGE THIS : TMP FOR DEVELOPMENT
    // only do this if share has changed
    yield fork(function* () {
        for (const share of remoteShares) {
            yield put(syncShareMembers(share.ShareID, (yield loadShareMembers(share.ShareID)) as ShareMember[]));

            if (share.Owner) {
                yield put(
                    syncShareInvites(share.ShareID, (yield loadPendingShareInvites(share.ShareID)) as PendingInvite[])
                );
            }
        }
    });

    const newShares = remoteShares.filter((share) => !localShareIds.includes(share.ShareID));
    logger.info(`[Saga::SharesChannel]`, `${newShares.length} remote share(s) not in cache`);

    if (newShares.length) {
        const activeNewShares = (
            (yield Promise.all(
                newShares
                    .filter((share) => share.TargetType === ShareType.Vault)
                    .map(({ ShareID }) => loadShare(ShareID, ShareType.Vault))
            )) as Maybe<Share>[]
        ).filter(truthy);

        if (activeNewShares.length > 0) {
            const items = (
                (yield Promise.all(
                    activeNewShares.map(async ({ shareId }) => ({
                        [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
                    }))
                )) as ItemsByShareId[]
            ).reduce(diadic(merge));

            yield put(sharesSync({ shares: toMap(activeNewShares, 'shareId'), items }));
            yield all(activeNewShares.map(getShareChannelForks(api, options)).flat());
        }
    }

    if (remotePrimaryShareId && localPrimaryShareId !== remotePrimaryShareId) {
        yield put(vaultSetPrimarySync({ id: remotePrimaryShareId }));
    }
}

/* The event-manager can be used to implement
 * a polling mechanism if we conform to the data
 * structure it is expecting. In order to poll for
 * new shares, set the query accordingly & use a
 * non-existing eventID */
export const createSharesChannel = (api: Api) =>
    eventChannelFactory<SharesGetResponse>({
        api,
        interval: ACTIVE_POLLING_TIMEOUT,
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        onClose: () => logger.info(`[Saga::SharesChannel] closing channel`),
        onEvent: onSharesEvent,
        query: () => ({ url: 'pass/v1/share', method: 'get' }),
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
    const events = fork(channelEventsWorker<SharesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<SharesGetResponse>, eventsChannel);
    const newVault = fork(onNewShare, api, options);

    yield all([events, wakeup, newVault]);
}
