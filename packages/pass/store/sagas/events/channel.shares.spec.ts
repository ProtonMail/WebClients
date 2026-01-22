import { channel, eventChannel, runSaga } from 'redux-saga';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import * as itemRequests from '@proton/pass/lib/items/item.requests';
import * as shareParser from '@proton/pass/lib/shares/share.parser';
import { sharesEventNew } from '@proton/pass/store/actions';
import type { EventChannel } from '@proton/pass/store/sagas/events/types';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, IndexedByShareIdAndItemId, ItemRevision, Share, ShareGetResponse, SharesGetResponse } from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import * as channelShare from './channel.share';
import * as SharesChannel from './channel.shares';

jest.mock('./channel.share', () => ({ getShareChannelForks: jest.fn().mockReturnValue(jest.fn()) }));
jest.mock('./channel.worker', () => ({
    ...jest.requireActual('./channel.worker'),
    channelInitalize: jest.fn(),
}));

const parseShareResponse = jest.spyOn(shareParser, 'parseShareResponse').mockImplementation();
const requestItemsForShareId = jest.spyOn(itemRequests, 'requestItemsForShareId').mockImplementation();
const getShareChannelForks = jest.spyOn(channelShare, 'getShareChannelForks');
const createNewSharesChannel = jest.spyOn(SharesChannel, 'createNewSharesChannel');
const createSharesChannel = jest.spyOn(SharesChannel, 'createSharesChannel');

describe('channel.shares saga', () => {
    const api = {} as unknown as Api;
    const options = {
        getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
    } as unknown as RootSagaOptions;

    const response = [{ ShareID: 'share1' }, { ShareID: 'share2' }] as ShareGetResponse[];

    const shares = response.map(({ ShareID }) => ({
        shareId: ShareID,
        name: ShareID,
    })) as unknown as Share[];

    const items: IndexedByShareIdAndItemId<ItemRevision> = {
        share1: { item1: { itemId: 'item1' } as any },
        share2: { item2: { itemId: 'item2' } as any },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        requestItemsForShareId.mockImplementation(async (shareId) => Object.values(items[shareId]));
        parseShareResponse.mockImplementation(async ({ ShareID }) => shares.find(({ shareId }) => shareId === ShareID));
    });

    describe('`onNewRemoteShares`', () => {
        test('should process new remote shares correctly', async () => {
            const { onNewRemoteShares } = SharesChannel;

            const newSharesChannel = channel<ShareGetResponse[]>();
            const saga = sagaSetup();
            const task = runSaga(saga.options, onNewRemoteShares, newSharesChannel, api, options);

            newSharesChannel.put(response);
            await saga.nextTick();

            expect(saga.dispatched).toContainEqual(sharesEventNew({ shares: toMap(shares, 'shareId'), items }));
            expect(getShareChannelForks).toHaveBeenCalledWith(api, options);
            expect(getShareChannelForks).toHaveBeenCalledTimes(2);

            task.cancel();
        });

        test('should close the `newSharesChannel` when cancelled', async () => {
            const { onNewRemoteShares } = SharesChannel;

            const newSharesChannel = channel<ShareGetResponse[]>();
            jest.spyOn(newSharesChannel, 'close');

            const saga = sagaSetup();
            const task = runSaga(saga.options, onNewRemoteShares, newSharesChannel, api, options);

            task.cancel();
            await saga.nextTick();

            expect(newSharesChannel.close).toHaveBeenCalled();
        });
    });

    describe('`sharesChannel`', () => {
        test('should cancel channels when the parent task is cancelled', async () => {
            const manager = { setInterval: noop };

            const eventsChannel = {
                manager,
                channel: eventChannel(() => noop),
                channelId: 'test-shares',
                onEvent: jest.fn(),
                onError: jest.fn(),
            } as unknown as EventChannel<SharesGetResponse>;

            const newSharesChannel = channel<ShareGetResponse[]>();

            jest.spyOn(newSharesChannel, 'close');
            jest.spyOn(eventsChannel.channel, 'close');

            try {
                const saga = sagaSetup();
                const task = runSaga(saga.options, SharesChannel.sharesChannel, api, options, { eventsChannel, newSharesChannel });

                await saga.nextTick();
                task.cancel();

                expect(newSharesChannel.close).toHaveBeenCalled();
                expect(eventsChannel.channel.close).toHaveBeenCalled();
            } finally {
                createNewSharesChannel.mockRestore();
                createSharesChannel.mockRestore();
            }
        });
    });
});
