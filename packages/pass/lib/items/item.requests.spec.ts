import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import type { ItemRevisionContentsResponse } from '../../types';
import { exposeApi } from '../api/api';
import { PassErrorCode } from '../api/errors';
import { PassCrypto } from '../crypto';
import { createShareRemovedError } from '../shares/share.test.utils';
import { batchByShareId, intoRevisionID, moveItems, requestItem } from './item.requests';
import { createTestItem } from './item.test.utils';

const api = jest.fn();
exposeApi(api as any);

jest.mock('@proton/pass/lib/crypto', () => ({
    PassCrypto: {
        moveItem: jest.fn(async ({ itemId, targetFolderId }) => ({
            ItemID: itemId,
            ItemKeys: [{ KeyRotation: 1, Key: 'reencrypted' }],
            DestinationFolderID: targetFolderId ?? null,
        })),
    },
}));

jest.mock('./item.parser', () => ({
    parseItemRevision: jest.fn(async (shareId: string, item: ItemRevisionContentsResponse) => ({
        shareId,
        itemId: item.ItemID,
    })),
}));

describe('Item requests', () => {
    describe('requestItem', () => {
        afterEach(() => jest.clearAllMocks());

        test('resolves `undefined` when the share has been removed', async () => {
            api.mockRejectedValue(createShareRemovedError(PassErrorCode.NOT_EXIST_SHARE));
            await expect(requestItem('s1', 'i1')).resolves.toBeUndefined();
        });

        test('resolves `undefined` when the share has been disabled', async () => {
            api.mockRejectedValue(createShareRemovedError(PassErrorCode.DISABLED_SHARE));
            await expect(requestItem('s1', 'i1')).resolves.toBeUndefined();
        });

        test('rethrows on any other fetch error', async () => {
            const err = new ApiError('', 500, 'TestError');
            api.mockRejectedValue(err);
            await expect(requestItem('s1', 'i1')).rejects.toBe(err);
        });
    });

    describe('batchByShareId', () => {
        const items = [
            createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 }),
            createTestItem('login', { shareId: 'share1', itemId: 'item2', revision: 2 }),
            createTestItem('login', { shareId: 'share2', itemId: 'item3', revision: 3 }),
        ];

        test('should batch items by `shareId`', () => {
            const batches = batchByShareId(items, (item) => ({ itemId: item.itemId, revision: item.revision }));

            expect(batches).toEqual([
                {
                    shareId: 'share1',
                    items: [
                        { itemId: 'item1', revision: 1 },
                        { itemId: 'item2', revision: 2 },
                    ],
                },
                { shareId: 'share2', items: [{ itemId: 'item3', revision: 3 }] },
            ]);
        });

        test('should handle empty items array', () => {
            const batches = batchByShareId([], (item) => item);
            expect(batches).toEqual([]);
        });
    });

    describe('intoRevisionID', () => {
        const item = createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 });

        test('should convert an item to a revision ID', () => {
            const revisionID = intoRevisionID(item);
            expect(revisionID).toStrictEqual({ ItemID: 'item1', Revision: 1 });
        });
    });

    describe('moveItems', () => {
        afterEach(() => jest.clearAllMocks());

        const mockApi = (moveResponse: any) =>
            api.mockImplementation(async ({ url }: { url: string }) => {
                if (url.endsWith('/key')) return { Keys: { Keys: [{ KeyRotation: 1, Key: 'source' }] } };
                return moveResponse;
            });

        const putCall = () => api.mock.calls.find(([{ method }]: [{ method: string }]) => method === 'put')![0];

        const folderMoveResponse = (FolderID: string | null) => ({
            Items: [{ ItemID: 'item1', Revision: 6, FolderID, ModifyTime: 10, RevisionTime: 10 }],
        });

        test('moves within the same share via the folder endpoint', async () => {
            mockApi(folderMoveResponse('folderB'));
            const item = createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 5, folderId: null });

            const [moved] = await moveItems([item], { targetShareId: 'share1', targetFolderId: 'folderB' });

            const { url, data } = putCall();
            expect(url).toBe('pass/v1/share/share1/item/folder');
            expect(data).toStrictEqual({
                FolderID: 'folderB',
                Items: [{ ItemID: 'item1', ItemKeys: [{ KeyRotation: 1, Key: 'reencrypted' }] }],
            });
            expect(PassCrypto.moveItem).toHaveBeenCalled();
            expect(moved.folderId).toBe('folderB');
            expect(moved.revision).toBe(6);
        });

        test('same-share move to the root sends a null folder id', async () => {
            mockApi(folderMoveResponse(null));
            const item = createTestItem('login', {
                shareId: 'share1',
                itemId: 'item1',
                revision: 5,
                folderId: 'folderA',
            });

            await moveItems([item], { targetShareId: 'share1' });

            const { url, data } = putCall();
            expect(url).toBe('pass/v1/share/share1/item/folder');
            expect(data.FolderID).toBeNull();
        });

        test('moves to different share', async () => {
            mockApi({ Items: [{ ItemID: 'item1' }] });
            const item = createTestItem('login', {
                shareId: 'share1',
                itemId: 'item1',
                revision: 5,
                folderId: 'folderA',
            });

            await moveItems([item], { targetShareId: 'share2', targetFolderId: 'folderB' });

            const { url, data } = putCall();
            expect(url).toBe('pass/v1/share/share1/item/share');
            expect(data.ShareID).toBe('share2');
            expect(data.Items[0].DestinationFolderID).toBe('folderB');
            expect(PassCrypto.moveItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    shareId: 'share1',
                    targetShareId: 'share2',
                    folderId: 'folderA',
                    targetFolderId: 'folderB',
                })
            );
        });
    });
});
