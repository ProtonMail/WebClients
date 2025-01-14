/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select, takeEvery } from 'redux-saga/effects';

import { type EventManagerEvent, NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { hasShareAccessChanged } from '@proton/pass/lib/shares/share.predicates';
import { shareAccessChange, sharedVaultCreated, sharesSync, vaultCreationSuccess } from '@proton/pass/store/actions';
import type { ItemsByShareId } from '@proton/pass/store/reducers';
import { selectAllShares } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, Maybe, Share, ShareRole, SharesGetResponse } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { or, truthy } from '@proton/pass/utils/fp/predicates';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { eventChannelFactory } from './channel.factory';
import { getShareChannelForks } from './channel.share';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel } from './types';

/** We're only interested in new shares in this effect : Deleted shares will
 * be handled by the share's EventChannel error handling. see `channel.share.ts`
 * code `PassErrorCode.DISABLED_SHARE`. FIXME: handle ItemShares */
function* onSharesEvent(
    event: EventManagerEvent<SharesGetResponse>,
    { api }: EventChannel<any>,
    options: RootSagaOptions
) {
    if ('error' in event) throw event.error;

    const localShares: Share[] = yield select(selectAllShares);
    const localShareIds = localShares.map(({ shareId }) => shareId);

    const remoteShares = event.Shares;

    const newShares = remoteShares.filter((share) => !localShareIds.includes(share.ShareID));

    if (newShares.length) {
        logger.info(`[ServerEvents::Shares]`, `${newShares.length} remote share(s) not in cache`);

        const activeNewShares = (
            (yield Promise.all(
                newShares
                    .filter((share) => share.TargetType === ShareType.Vault)
                    .map((encryptedShare) => parseShareResponse(encryptedShare))
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

    yield fork(function* () {
        for (const share of remoteShares) {
            const shareId = share.ShareID;
            const localShare = localShares.find((localShare) => localShare.shareId === shareId);

            if (localShare && hasShareAccessChanged(localShare, share)) {
                yield put(
                    shareAccessChange({
                        newUserInvitesReady: share.NewUserInvitesReady,
                        owner: share.Owner,
                        shared: share.Shared,
                        shareId,
                        shareRoleId: share.ShareRoleID as ShareRole,
                        targetMaxMembers: share.TargetMaxMembers,
                        targetMembers: share.TargetMembers,
                    })
                );
            }
        }
    });
}

/* The event-manager can be used to implement
 * a polling mechanism if we conform to the data
 * structure it is expecting. In order to poll for
 * new shares, set the query accordingly & use a
 * non-existing eventID */
export const createSharesChannel = (api: Api) =>
    eventChannelFactory<SharesGetResponse>({
        api,
        channelId: 'shares',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        onClose: () => logger.info(`[ServerEvents::Shares] closing channel`),
        onEvent: onSharesEvent,
        query: () => ({ url: 'pass/v1/share', method: 'get' }),
    });

/* when a vault is created : recreate all the necessary
 * channels to start polling for this new share's events */
function* onNewShare(api: Api, options: RootSagaOptions) {
    yield takeEvery(or(vaultCreationSuccess.match, sharedVaultCreated.match), function* ({ payload: { share } }) {
        yield all(getShareChannelForks(api, options)(share));
    });
}

export function* sharesChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[ServerEvents::Shares] start polling for new shares`);
    const eventsChannel = createSharesChannel(api);
    const events = fork(channelEvents<SharesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<SharesGetResponse>, eventsChannel, options);
    const newVault = fork(onNewShare, api, options);

    yield all([events, wakeup, newVault]);
}
