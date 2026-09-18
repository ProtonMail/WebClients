import { channel, eventChannel, runSaga } from 'redux-saga';

import { toMap } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import { ACTIVE_POLLING_TIMEOUT } from '../../../../lib/events/constants';
import * as folderRequests from '../../../../lib/folders/folders.requests';
import * as itemRequests from '../../../../lib/items/item.requests';
import * as shareParser from '../../../../lib/shares/share.parser';
import type {
    Api,
    FolderData,
    IndexedByShareIdAndItemId,
    ItemRevision,
    Share,
    ShareGetResponse,
    SharesGetResponse,
} from '../../../../types';
import { ShareType } from '../../../../types';
import { sharesEventNew } from '../../../actions';
import type { RootSagaOptions } from '../../../types';
import { sagaSetup } from '../../testing';
import * as channelShare from './channel.share';
import * as SharesChannel from './channel.shares';
import type { EventChannel } from './types';

jest.mock('./channel.share', () => ({ getShareChannelForks: jest.fn().mockReturnValue(jest.fn()) }));
jest.mock('./channel.worker', () => ({
    ...jest.requireActual('./channel.worker'),
    channelInitalize: jest.fn(),
}));
jest.mock('@proton/pass/lib/shares/share.parser', () => ({
    ...jest.requireActual('@proton/pass/lib/shares/share.parser'),
    parseShareResponse: jest.fn(),
}));
jest.mock('@proton/pass/lib/items/item.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/items/item.requests'),
    requestItemsForShareId: jest.fn(),
}));
jest.mock('@proton/pass/lib/folders/folders.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/folders/folders.requests'),
    requestFoldersForShareId: jest.fn(),
}));
jest.mock('./channel.shares', () => ({
    ...jest.requireActual('./channel.shares'),
    createSharesChannel: jest.fn(jest.requireActual('./channel.shares').createSharesChannel),
}));

const parseShareResponse = jest.mocked(shareParser.parseShareResponse).mockImplementation();
const requestItemsForShareId = jest.mocked(itemRequests.requestItemsForShareId).mockImplementation();
const requestFoldersForShareId = jest.mocked(folderRequests.requestFoldersForShareId).mockImplementation();
const getShareChannelForks = jest.mocked(channelShare.getShareChannelForks);
const createSharesChannel = jest.mocked(SharesChannel.createSharesChannel);

describe('channel.shares saga', () => {
    const api = {} as unknown as Api;
    const options = {
        getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
    } as unknown as RootSagaOptions;

    const response = [{ ShareID: 'share1' }, { ShareID: 'share2' }] as ShareGetResponse[];
    const shares = response.map(({ ShareID }) => ({
        shareId: ShareID,
        name: ShareID,
        targetType: ShareType.Vault,
    })) as unknown as Share[];

    const items: IndexedByShareIdAndItemId<ItemRevision> = {
        share1: { item1: { itemId: 'item1' } as any },
        share2: { item2: { itemId: 'item2' } as any },
    };

    const folders: FolderData[] = [
        {
            folderId: 'folder1',
            shareId: 'share1',
            vaultId: 'vault1',
            name: 'Folder 1',
            parentFolderId: null,
            keyRotation: 1,
        },
        {
            folderId: 'folder2',
            shareId: 'share1',
            vaultId: 'vault1',
            name: 'Folder 2',
            parentFolderId: null,
            keyRotation: 1,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        requestItemsForShareId.mockImplementation(async (shareId) => Object.values(items[shareId]));
        requestFoldersForShareId.mockImplementation(async () => []);
        parseShareResponse.mockImplementation(async ({ ShareID }) => shares.find(({ shareId }) => shareId === ShareID));
    });

    describe('`onSharesIncoming`', () => {
        test('should process new remote shares correctly', async () => {
            const { onSharesIncoming } = SharesChannel;
            const incoming = channel<ShareGetResponse[]>();
            const saga = sagaSetup();
            const task = runSaga(saga.options, onSharesIncoming, incoming, api, options);

            incoming.put(response);
            await saga.nextTick();

            expect(saga.dispatched).toContainEqual(
                sharesEventNew({
                    shares: toMap(shares, 'shareId'),
                    items,
                    folders: { share1: {}, share2: {} },
                    v: 1,
                })
            );
            expect(getShareChannelForks).toHaveBeenCalledWith(api, options);
            expect(getShareChannelForks).toHaveBeenCalledTimes(2);

            task.cancel();
        });

        test('should process new remote shares with folders', async () => {
            const { onSharesIncoming } = SharesChannel;
            requestFoldersForShareId.mockImplementation(async (shareId) => folders.filter((f) => f.shareId === shareId));

            const incoming = channel<ShareGetResponse[]>();
            const saga = sagaSetup();
            const task = runSaga(saga.options, onSharesIncoming, incoming, api, options);

            incoming.put(response);
            await saga.nextTick();

            const expectedFolders = {
                share1: toMap(
                    folders.filter((f) => f.shareId === 'share1'),
                    'folderId'
                ),
                share2: {},
            };

            expect(saga.dispatched).toContainEqual(
                sharesEventNew({
                    shares: toMap(shares, 'shareId'),
                    items,
                    folders: expectedFolders,
                    v: 1,
                })
            );

            expect(requestFoldersForShareId).toHaveBeenCalledWith('share1');
            expect(requestFoldersForShareId).toHaveBeenCalledWith('share2');
            expect(getShareChannelForks).toHaveBeenCalledTimes(2);

            task.cancel();
        });

        test('should handle folder fetch errors gracefully', async () => {
            const { onSharesIncoming } = SharesChannel;
            requestFoldersForShareId.mockImplementation(async (shareId) => {
                if (shareId === 'share1') throw new Error('Folder fetch failed');
                return [];
            });

            const incoming = channel<ShareGetResponse[]>();
            const saga = sagaSetup();
            const task = runSaga(saga.options, onSharesIncoming, incoming, api, options);

            incoming.put(response);
            await saga.nextTick();

            expect(saga.dispatched).toContainEqual(
                sharesEventNew({
                    shares: toMap(shares, 'shareId'),
                    items,
                    folders: { share1: {}, share2: {} },
                    v: 1,
                })
            );

            expect(getShareChannelForks).toHaveBeenCalledTimes(2);

            task.cancel();
        });

        test('should close the `incoming` when cancelled', async () => {
            const { onSharesIncoming } = SharesChannel;

            const incoming = channel<ShareGetResponse[]>();
            jest.spyOn(incoming, 'close');

            const saga = sagaSetup();
            const task = runSaga(saga.options, onSharesIncoming, incoming, api, options);

            task.cancel();
            await saga.nextTick();

            expect(incoming.close).toHaveBeenCalled();
        });
    });

    describe('`sharesChannel`', () => {
        test('should cancel channels when the parent task is cancelled', async () => {
            const manager = { setInterval: noop };

            const events = {
                manager,
                channel: eventChannel(() => noop),
                channelId: 'test-shares',
                onEvent: jest.fn(),
                onError: jest.fn(),
            } as unknown as EventChannel<SharesGetResponse>;

            const incoming = channel<ShareGetResponse[]>();
            jest.spyOn(incoming, 'close');
            jest.spyOn(events.channel, 'close');

            try {
                const saga = sagaSetup();
                const task = runSaga(saga.options, SharesChannel.sharesChannel, api, options, { events, incoming });
                await saga.nextTick();
                task.cancel();

                expect(incoming.close).toHaveBeenCalled();
                expect(events.channel.close).toHaveBeenCalled();
            } finally {
                createSharesChannel.mockImplementation(jest.requireActual('./channel.shares').createSharesChannel);
            }
        });
    });
});
