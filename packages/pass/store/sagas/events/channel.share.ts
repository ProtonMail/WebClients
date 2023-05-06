/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import type { AnyAction } from 'redux';
import { all, call, fork, put, select, take } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import type {
    Api,
    ItemRevision,
    MaybeNull,
    PassEventListResponse,
    ServerEvent,
    Share,
    ShareKeyResponse,
    TypedOpenedShare,
} from '@proton/pass/types';
import { ChannelType, ShareType } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';
import { decodeVaultContent } from '@proton/pass/utils/protobuf';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';

import {
    itemDeleteSync,
    itemEditSync,
    itemLastUseTimeUpdated,
    shareDeleteSync,
    shareEditSync,
    vaultDeleteSuccess,
} from '../../actions';
import { selectAllShares, selectShare } from '../../selectors';
import type { WorkerRootSagaOptions } from '../../types';
import { parseItemRevision } from '../workers/items';
import { getAllShareKeys } from '../workers/vaults';
import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

/* It is Important to call onShareEventItemsDeleted before
 * actually dispatching the resulting action : we may be dealing
 * with a share or an item being selected in the pop-up and need
 * to run the side-effect before clearing the data from the store
 * FIXME: support ItemShares */
export function* onShareEvent(
    event: ServerEvent<ChannelType.SHARE>,
    _: EventChannel<ChannelType.SHARE>,
    { onItemsChange, onShareEventItemsDeleted }: WorkerRootSagaOptions
) {
    if (event.error) throw event.error;

    const { Events, shareId } = event;
    const { LatestEventID, DeletedItemIDs, UpdatedItems, UpdatedShare, LastUseItems } = Events;
    logger.info(`[Saga::ShareChannel] event ${logId(LatestEventID)} for share ${logId(shareId)}`);

    if (UpdatedShare && UpdatedShare.TargetType === ShareType.Vault) {
        const shareKeys: ShareKeyResponse[] = yield getAllShareKeys(UpdatedShare.ShareID);
        const share: MaybeNull<TypedOpenedShare<ShareType.Vault>> = yield PassCrypto.openShare({
            encryptedShare: UpdatedShare,
            shareKeys,
        });

        if (share) {
            yield put(
                shareEditSync({
                    id: share.shareId,
                    share: {
                        shareId: share.shareId,
                        vaultId: share.vaultId,
                        targetId: share.targetId,
                        targetType: share.targetType,
                        content: decodeVaultContent(share.content),
                        primary: Boolean(UpdatedShare.Primary),
                        eventId: LatestEventID,
                    },
                })
            );
        }
    }

    if (DeletedItemIDs.length > 0) {
        onShareEventItemsDeleted?.(event.shareId, DeletedItemIDs);
    }

    yield all([
        ...DeletedItemIDs.map((itemId) => put(itemDeleteSync({ itemId, shareId }))),
        ...UpdatedItems.map((encryptedItem) =>
            call(function* () {
                const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);
                yield put(itemEditSync({ shareId: item.shareId, itemId: item.itemId, item }));
            })
        ),
        ...(LastUseItems ?? []).map(({ ItemID, LastUseTime }) =>
            put(itemLastUseTimeUpdated({ shareId, itemId: ItemID, lastUseTime: LastUseTime }))
        ),
    ]);

    const itemsMutated = DeletedItemIDs.length > 0 || UpdatedItems.length > 0;
    if (itemsMutated) onItemsChange?.();
}

function* onShareEventError(
    error: unknown,
    { channel, shareId }: EventChannel<ChannelType.SHARE>,
    { onShareEventDisabled, onItemsChange }: WorkerRootSagaOptions
) {
    const { code } = getApiError(error);

    /* share was deleted or user lost access */
    if (code === 300004) {
        logger.info(`[Saga::SharesChannel] share ${logId(shareId)} disabled`);
        channel.close();

        const share: Share = yield select(selectShare(shareId));
        onShareEventDisabled?.(shareId);
        onItemsChange?.();
        yield put(shareDeleteSync(share));
    }
}

function* onShareDeleted({ channel, shareId }: EventChannel<ChannelType.SHARE>): Generator {
    yield take((action: AnyAction) => vaultDeleteSuccess.match(action) && action.payload.id === shareId);
    logger.info(`[Saga::ShareChannel] share ${logId(shareId)} deleted`);
    channel.close();
}

/* We need to lift the response to the correct data
 * structure by leveraging ApiOptions::mapResponse
 * (see type definition and create-api.ts for specs) */
export const createShareChannel = (api: Api, { shareId, eventId }: Share) =>
    eventChannelFactory<ChannelType.SHARE>({
        api,
        type: ChannelType.SHARE,
        interval: INTERVAL_EVENT_TIMER,
        shareId,
        eventID: eventId,
        mapEvent: (event) => ({ ...event, shareId }),
        onClose: () => logger.info(`[Saga::ShareChannel] closing channel for ${logId(shareId)}`),
        onEvent: onShareEvent,
        onError: onShareEventError,
        query: (eventId) => {
            return {
                url: `pass/v1/share/${shareId}/event/${eventId}`,
                mapResponse: (response: { Events: PassEventListResponse }) => ({
                    ...response,
                    EventID: response.Events.LatestEventID,
                    More: response.Events.EventsPending,
                }),
            };
        },
    });

export const getShareChannelForks = (api: Api, options: WorkerRootSagaOptions) => (share: Share) => {
    logger.info(`[Saga::ShareChannel] start polling for share ${logId(share.shareId)}`);

    const eventsChannel = createShareChannel(api, share);
    const events = fork(channelEventsWorker<ChannelType.SHARE>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<ChannelType.SHARE>, eventsChannel);
    const onDelete = fork(onShareDeleted, eventsChannel);

    return [events, wakeup, onDelete];
};

export function* shareChannels(api: Api, options: WorkerRootSagaOptions) {
    const shares = (yield select(selectAllShares)) as Share[];
    yield all(shares.map(getShareChannelForks(api, options)).flat());
}
