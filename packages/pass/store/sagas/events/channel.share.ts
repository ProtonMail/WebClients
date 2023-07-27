/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import type { AnyAction } from 'redux';
import { all, call, fork, put, select, take } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import type {
    Api,
    ItemRevision,
    MaybeNull,
    PassEventListResponse,
    Share,
    ShareKeyResponse,
    TypedOpenedShare,
} from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';
import { decodeVaultContent } from '@proton/pass/utils/protobuf';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';

import type { EventManagerEvent } from '../../../events/manager';
import {
    itemDeleteSync,
    itemEditSync,
    itemLastUseTimeUpdated,
    shareDeleteSync,
    shareEditSync,
    shareEvent,
    vaultDeleteSuccess,
} from '../../actions';
import { selectAllShares, selectShare } from '../../selectors';
import type { WorkerRootSagaOptions } from '../../types';
import { parseItemRevision } from '../workers/items';
import { getShareLatestEventId } from '../workers/shares';
import { getAllShareKeys } from '../workers/vaults';
import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

export type ShareEventResponse = { Events: PassEventListResponse };

/* It is Important to call onShareEventItemsDeleted before
 * actually dispatching the resulting action : we may be dealing
 * with a share or an item being selected in the pop-up and need
 * to run the side-effect before clearing the data from the store
 * FIXME: support ItemShares */
const onShareEvent = (shareId: string) =>
    function* (
        event: EventManagerEvent<ShareEventResponse>,
        _: EventChannel<ShareEventResponse>,
        { onItemsChange, onShareEventItemsDeleted }: WorkerRootSagaOptions
    ) {
        if ('error' in event) throw event.error;

        yield put(shareEvent({ ...event, shareId }));

        const { Events } = event;
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
            onShareEventItemsDeleted?.(shareId, DeletedItemIDs);
        }

        yield all([
            ...DeletedItemIDs.map((itemId) => put(itemDeleteSync({ itemId, shareId }))),
            ...UpdatedItems.map((encryptedItem) =>
                call(function* () {
                    try {
                        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);
                        yield put(itemEditSync({ shareId: item.shareId, itemId: item.itemId, item }));
                    } catch (_) {}
                })
            ),
            ...(LastUseItems ?? []).map(({ ItemID, LastUseTime }) =>
                put(itemLastUseTimeUpdated({ shareId, itemId: ItemID, lastUseTime: LastUseTime }))
            ),
        ]);

        const itemsMutated = DeletedItemIDs.length > 0 || UpdatedItems.length > 0;
        if (itemsMutated) onItemsChange?.();
    };

const onShareEventError = (shareId: string) =>
    function* (
        error: unknown,
        { channel }: EventChannel<ShareEventResponse>,
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
    };

const onShareDeleted = (shareId: string) =>
    function* ({ channel }: EventChannel<ShareEventResponse>): Generator {
        yield take((action: AnyAction) => vaultDeleteSuccess.match(action) && action.payload.id === shareId);
        logger.info(`[Saga::ShareChannel] share ${logId(shareId)} deleted`);
        channel.close();
    };

/* We need to lift the response to the correct data
 * structure by leveraging ApiOptions::mapResponse
 * (see type definition and create-api.ts for specs) */
export const createShareChannel = (api: Api, { shareId, eventId }: Share) =>
    eventChannelFactory<ShareEventResponse>({
        api,
        interval: INTERVAL_EVENT_TIMER,
        initialEventID: eventId,
        query: (eventId) => ({ url: `pass/v1/share/${shareId}/event/${eventId}`, method: 'get' }),
        getCursor: ({ Events }) => ({ EventID: Events.LatestEventID, More: Events.EventsPending }),
        getLatestEventID: () => getShareLatestEventId(shareId),
        onClose: () => logger.info(`[Saga::ShareChannel] closing channel for ${logId(shareId)}`),
        onEvent: onShareEvent(shareId),
        onError: onShareEventError(shareId),
    });

export const getShareChannelForks = (api: Api, options: WorkerRootSagaOptions) => (share: Share) => {
    logger.info(`[Saga::ShareChannel] start polling for share ${logId(share.shareId)}`);
    const eventsChannel = createShareChannel(api, share);
    const events = fork(channelEventsWorker<ShareEventResponse>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<ShareEventResponse>, eventsChannel);
    const onDelete = fork(onShareDeleted(share.shareId), eventsChannel);

    return [events, wakeup, onDelete];
};

export function* shareChannels(api: Api, options: WorkerRootSagaOptions) {
    const shares = (yield select(selectAllShares)) as Share[];
    yield all(shares.map(getShareChannelForks(api, options)).flat());
}
