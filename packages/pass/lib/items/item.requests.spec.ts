import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import * as API from '../api/api';
import { PassErrorCode } from '../api/errors';
import { createShareRemovedError } from '../shares/share.test.utils';
import { batchByShareId, intoRevisionID, requestItem } from './item.requests';
import { createTestItem } from './item.test.utils';

const api = jest.fn();
(API as any).api = api;

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
});
