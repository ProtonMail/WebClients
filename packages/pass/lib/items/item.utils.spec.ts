import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import type { Draft } from '@proton/pass/store/reducers';
import type { IndexedByShareIdAndItemId, ItemRevision, LoginItem, SelectedItem } from '@proton/pass/types';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import {
    batchByShareId,
    filterItemsByShareId,
    filterItemsByType,
    filterItemsByUserIdentifier,
    flattenItemsByShareId,
    getItemActionId,
    getItemKey,
    getItemKeyRevision,
    getSanitizedUserIdentifiers,
    interpolateRecentItems,
    intoIdentityItemPreview,
    intoLoginItemPreview,
    intoRevisionID,
    intoSelectedItem,
    intoUserIdentifier,
    matchDraftsForShare,
    sortItems,
} from './item.utils';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

describe('Item utils', () => {
    describe('getItemKey', () => {
        test('should return the correct key string', () => {
            const input = createTestItem('login', { shareId: 'share123', itemId: 'item456', revision: 789 });
            const result = getItemKey(input);
            expect(result).toBe('item-share123-item456');
        });
    });

    describe('getItemKeyRevision', () => {
        test('should return the correct key string', () => {
            const input = createTestItem('login', { shareId: 'share123', itemId: 'item456', revision: 1 });
            const result = getItemKeyRevision(input);
            expect(result).toBe('share123-item456-1');
        });
    });

    describe('intoSelectedItem', () => {
        test('should return the correct `SelectedItem` object', () => {
            const input = createTestItem('login', { shareId: 'share123', itemId: 'item456', revision: 789 });
            const expected: SelectedItem = { shareId: 'share123', itemId: 'item456' };
            const result = intoSelectedItem(input);
            expect(result).toStrictEqual(expected);
        });
    });

    describe('getItemActionId', () => {
        test('should return the correct optimistic ID for optimistic payloads', () => {
            const input = { optimisticId: 'optimistic123', shareId: 'share123' };
            const result = getItemActionId(input);
            expect(result).toBe('share123-optimistic123');
        });

        test('should return the correct optimistic ID for non-optimistic payloads', () => {
            const input = { itemId: 'item456', shareId: 'share123' };
            const result = getItemActionId(input);
            expect(result).toBe('share123-item456');
        });

        test('should prioritize `optimisticId` over `itemId`', () => {
            const input = { optimisticId: 'optimistic123', itemId: 'item456', shareId: 'share123' };
            const result = getItemActionId(input);
            expect(result).toBe('share123-optimistic123');
        });
    });

    describe('flattenItemsByShareId', () => {
        test('should return a flat array of `ItemRevision` objects', () => {
            const revisions = [
                createTestItem('login', { shareId: 'share123', itemId: 'item1', revision: 1 }),
                createTestItem('login', { shareId: 'share123', itemId: 'item2', revision: 2 }),
                createTestItem('login', { shareId: 'share456', itemId: 'item3', revision: 3 }),
            ];

            const input: IndexedByShareIdAndItemId<ItemRevision> = {
                share123: { item1: revisions[0], item2: revisions[1] },
                share456: { item3: revisions[2] },
            };

            const result = flattenItemsByShareId(input);
            expect(result).toEqual(revisions);
        });

        test('should return an empty array if no items are present', () => {
            const input = {};
            const result = flattenItemsByShareId(input);
            expect(result).toEqual([]);
        });
    });

    describe('interpolateRecentItems', () => {
        test('should interpolate items into correct date clusters', () => {
            const now = 1000000000;
            (getEpoch as jest.Mock).mockReturnValue(now);

            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    modifyTime: now - UNIX_DAY / 2,
                }),
                createTestItem('login', {
                    shareId: 'share2',
                    itemId: 'item2',
                    revision: 2,
                    modifyTime: now - UNIX_DAY * 3,
                }),
                createTestItem('login', {
                    shareId: 'share3',
                    itemId: 'item3',
                    revision: 3,
                    modifyTime: now - UNIX_WEEK * 2 + UNIX_DAY,
                }),
                createTestItem('login', {
                    shareId: 'share4',
                    itemId: 'item4',
                    revision: 4,
                    modifyTime: now - UNIX_MONTH,
                }),
            ];

            const expectedClusters = [
                { label: 'Today', boundary: now - UNIX_DAY },
                { label: 'Last week', boundary: now - UNIX_WEEK },
                { label: 'Last 2 weeks', boundary: now - UNIX_WEEK * 2 },
                { label: 'Last month', boundary: now - UNIX_MONTH },
            ];

            expect(interpolateRecentItems(items)(true)).toEqual({
                interpolation: [
                    { type: 'interpolation', cluster: expectedClusters[0] },
                    { type: 'entry', entry: items[0] },
                    { type: 'entry', entry: items[1] },
                    { type: 'entry', entry: items[2] },
                    { type: 'entry', entry: items[3] },
                ],
                interpolationIndexes: [0],
                interpolated: true,
                clusters: expectedClusters,
            });
        });

        test('should return all items in fallback cluster if `shouldInterpolate` is false', () => {
            const now = 1000000000;
            (getEpoch as jest.Mock).mockReturnValue(now);

            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    modifyTime: now - UNIX_DAY,
                }),
            ];

            expect(interpolateRecentItems(items)(false)).toEqual({
                interpolation: [{ type: 'entry', entry: items[0] }],
                interpolationIndexes: [],
                interpolated: false,
                clusters: [],
            });
        });
    });

    describe('filterItemsByShareId', () => {
        test('should return all items if `shareId` is not defined', () => {
            const items = [
                createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 }),
                createTestItem('login', { shareId: 'share2', itemId: 'item2', revision: 2 }),
            ];

            expect(filterItemsByShareId()(items)).toEqual(items);
        });

        test('should filter items by `shareId`', () => {
            const items = [
                createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 }),
                createTestItem('login', { shareId: 'share2', itemId: 'item2', revision: 2 }),
            ];

            expect(filterItemsByShareId('share1')(items)).toEqual([items[0]]);
        });
    });

    describe('filterItemsByType', () => {
        test('should return all items if `itemType` is not defined', () => {
            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    data: itemBuilder('login').data,
                }),
                createTestItem('note', {
                    shareId: 'share2',
                    itemId: 'item2',
                    revision: 2,
                    data: itemBuilder('note').data,
                }),
            ];

            expect(filterItemsByType()(items)).toEqual(items);
        });

        test('should filter items by `itemType`', () => {
            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    data: itemBuilder('login').data,
                }),
                createTestItem('note', {
                    shareId: 'share2',
                    itemId: 'item2',
                    revision: 2,
                    data: itemBuilder('note').data,
                }),
            ];

            expect(filterItemsByType('login')(items)).toEqual([items[0]]);
        });
    });

    describe('filterItemsByUserIdentifier', () => {
        test('should filter items by user identifier', () => {
            const login1 = itemBuilder('login');
            login1.get('content').set('itemEmail', 'user@example.com');

            const login2 = itemBuilder('login');
            login2.get('content').set('itemEmail', 'other@example.com');

            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    data: login1.data,
                }),
                createTestItem('login', {
                    shareId: 'share2',
                    itemId: 'item2',
                    revision: 2,
                    data: login2.data,
                }),
            ] as LoginItem[];

            expect(filterItemsByUserIdentifier('user@example.com')(items)).toEqual([items[0]]);
        });

        test('should return an empty array if no items match the user identifier', () => {
            const login1 = itemBuilder('login');
            login1.get('content').set('itemEmail', 'other@example.com');

            const login2 = itemBuilder('login');
            login2.get('content').set('itemEmail', 'another@example.com');

            const items = [
                createTestItem('login', {
                    shareId: 'share1',
                    itemId: 'item1',
                    revision: 1,
                    data: login1.data,
                }),
                createTestItem('login', {
                    shareId: 'share2',
                    itemId: 'item2',
                    revision: 2,
                    data: login2.data,
                }),
            ] as LoginItem[];

            expect(filterItemsByUserIdentifier('user@example.com')(items)).toEqual([]);
        });
    });

    describe('sortItems', () => {
        const items = [
            createTestItem('login', {
                shareId: 'share1',
                itemId: 'item1',
                revision: 1,
                createTime: 1000,
                modifyTime: 2000,
            }),
            createTestItem('login', {
                shareId: 'share2',
                itemId: 'item2',
                revision: 2,
                createTime: 2000,
                modifyTime: 3000,
            }),
            createTestItem('login', {
                shareId: 'share3',
                itemId: 'item3',
                revision: 3,
                createTime: 3000,
                modifyTime: 1000,
            }),
        ];

        test('should sort items by createTimeASC', () => {
            const sortedItems = sortItems('createTimeASC')(items);
            expect(sortedItems.map((item) => item.itemId)).toEqual(['item1', 'item2', 'item3']);
        });

        test('should sort items by createTimeDESC', () => {
            const sortedItems = sortItems('createTimeDESC')(items);
            expect(sortedItems.map((item) => item.itemId)).toEqual(['item3', 'item2', 'item1']);
        });

        test('should sort items by most recent (lastUseTime or modifyTime)', () => {
            const sortedItems = sortItems('recent')(items);
            expect(sortedItems.map((item) => item.itemId)).toEqual(['item2', 'item1', 'item3']);
        });

        test('should sort items by titleASC', () => {
            const login1 = itemBuilder('login');
            login1.get('metadata').set('name', 'Zebra');

            const login2 = itemBuilder('login');
            login2.get('metadata').set('name', 'Apple');

            const login3 = itemBuilder('login');
            login3.get('metadata').set('name', 'Mango');

            const itemsWithTitles = [
                createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1, data: login1.data }),
                createTestItem('login', { shareId: 'share2', itemId: 'item2', revision: 2, data: login2.data }),
                createTestItem('login', { shareId: 'share3', itemId: 'item3', revision: 3, data: login3.data }),
            ];
            const sortedItems = sortItems('titleASC')(itemsWithTitles);
            expect(sortedItems.map((item) => item.data.metadata.name)).toEqual(['Apple', 'Mango', 'Zebra']);
        });
    });

    describe('matchDraftsForShare', () => {
        const drafts: Draft[] = [
            { mode: 'edit', shareId: 'share1', itemId: 'item1', revision: 1, formData: null },
            { mode: 'edit', shareId: 'share2', itemId: 'item2', revision: 2, formData: null },
            { mode: 'edit', shareId: 'share1', itemId: 'item3', revision: 3, formData: null },
        ];

        test('should filter drafts by `shareId` only', () => {
            const filteredDrafts = matchDraftsForShare(drafts, 'share1');
            expect(filteredDrafts).toEqual([drafts[0], drafts[2]]);
        });

        test('should filter drafts by `shareId` and `itemIds`', () => {
            const filteredDrafts = matchDraftsForShare(drafts, 'share1', ['item1']);
            expect(filteredDrafts).toEqual([drafts[0]]);
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

    describe('intoUserIdentifier', () => {
        const login = itemBuilder('login');

        test('should return username if not empty', () => {
            login.get('content').set('itemUsername', 'username').set('itemEmail', 'email@example.com');
            const item = createTestItem('login', { data: login.data }) as LoginItem;
            expect(intoUserIdentifier(item)).toBe('username');
        });

        test('should return email if username is empty', () => {
            login.get('content').set('itemUsername', '').set('itemEmail', 'email@example.com');
            const item = createTestItem('login', { data: login.data }) as LoginItem;
            expect(intoUserIdentifier(item)).toBe('email@example.com');
        });
    });

    describe('intoLoginItemPreview', () => {
        const login = itemBuilder('login');
        login.get('content').set('urls', ['https://example.com']).set('itemUsername', 'username');
        login.get('metadata').set('name', 'My Login');

        const item = createTestItem('login', {
            shareId: 'share1',
            itemId: 'item1',
            data: login.data,
        }) as LoginItem;

        test('should convert an item to a LoginItemPreview', () => {
            expect(intoLoginItemPreview(item)).toStrictEqual({
                itemId: 'item1',
                shareId: 'share1',
                name: 'My Login',
                userIdentifier: 'username',
                url: 'https://example.com',
            });
        });
    });

    describe('intoIdentityItemPreview', () => {
        const identity = itemBuilder('identity');
        identity.get('content').set('fullName', 'John Doe');
        identity.get('metadata').set('name', 'My Identity');

        const item = createTestItem('identity', {
            shareId: 'share1',
            itemId: 'item1',
            data: identity.data,
        }) as ItemRevision<'identity'>;

        test('should convert an item to an IdentityItemPreview', () => {
            expect(intoIdentityItemPreview(item)).toStrictEqual({
                itemId: 'item1',
                shareId: 'share1',
                name: 'My Identity',
                fullName: 'John Doe',
            });
        });
    });

    describe('getSanitizedUserIdentifiers', () => {
        test.each([
            [
                'valid email & empty username',
                { itemEmail: 'test@proton.me', itemUsername: '' },
                { email: 'test@proton.me', username: '' },
            ],
            [
                'valid email & invalid username email',
                { itemEmail: 'test@proton.me', itemUsername: 'username' },
                { email: 'test@proton.me', username: 'username' },
            ],
            [
                'valid email & valid username email',
                { itemEmail: 'test@proton.me', itemUsername: 'test@proton.me' },
                { email: 'test@proton.me', username: 'test@proton.me' },
            ],
            [
                'invalid email & empty username',
                { itemEmail: 'invalid-email', itemUsername: '' },
                { email: '', username: 'invalid-email' },
            ],
            [
                'invalid email & valid username email',
                { itemEmail: 'invalid-email', itemUsername: 'test@proton.me' },
                { email: 'test@proton.me', username: 'invalid-email' },
            ],
            [
                'empty email & valid username email',
                { itemEmail: '', itemUsername: 'valid@example.com' },
                { email: 'valid@example.com', username: '' },
            ],
            [
                'empty email & invalid username email',
                { itemEmail: '', itemUsername: 'invalid-email' },
                { email: '', username: 'invalid-email' },
            ],
            [
                'empty email & valid username email',
                { itemEmail: '', itemUsername: 'valid@proton.me' },
                { email: 'valid@proton.me', username: '' },
            ],
            ['empty email, empty username', { itemEmail: '', itemUsername: '' }, { email: '', username: '' }],
        ])('should handle %s correctly', (_, input, expected) => {
            const result = getSanitizedUserIdentifiers(input);
            expect(result).toEqual(expected);
        });
    });
});
