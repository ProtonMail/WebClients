import { uniqueId } from 'lodash';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemRevision} from '@proton/pass/types';
import { ContentFormatVersion, ItemState } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

import { getDuplicatePasswords } from './monitor.utils';

const createMockItem = (password: string): ItemRevision<'login'> => ({
    shareId: 'shareId',
    aliasEmail: null,
    contentFormatVersion: ContentFormatVersion.Item,
    createTime: -1,
    itemId: uniqueId(),
    lastUseTime: null,
    modifyTime: -1,
    pinned: false,
    revision: 1,
    revisionTime: -1,
    state: ItemState.Active,
    data: itemBuilder('login').set('content', (content) => content.set('password', password)).data,
});

describe('getDuplicatePasswords', () => {
    test('should correctly identify and return duplicate passwords', () => {
        const items = [
            ...Array.from({ length: 5 }, () => createMockItem('AAA')),
            ...Array.from({ length: 2 }, () => createMockItem('BBB')),
            ...Array.from({ length: 5 }, () => createMockItem(uniqueId())),
        ].sort(() => Math.random() - 0.5); /* shuffle the array */

        const duplicates = getDuplicatePasswords(items).sort((a, b) => b.length - a.length);
        expect(duplicates.length).toEqual(2);
        expect(duplicates[0].length).toEqual(5);
        expect(duplicates[1].length).toEqual(2);
        expect(new Set(duplicates[0].map(prop('itemId'))).size).toEqual(5);
        expect(new Set(duplicates[1].map(prop('itemId'))).size).toEqual(2);
    });

    test('should handle case where there are no duplicates', () => {
        const items = Array.from({ length: 10 }, () => createMockItem(uniqueId()));
        const duplicates = getDuplicatePasswords(items).sort((a, b) => b.length - a.length);
        expect(duplicates.length).toEqual(0);
    });

    test('should handle case when there are no logins', () => {
        expect(getDuplicatePasswords([])).toEqual([]);
    });
});
