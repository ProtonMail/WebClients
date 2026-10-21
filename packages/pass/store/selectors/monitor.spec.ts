import uniqueId from 'lodash/uniqueId';

import { itemBuilder } from '../../lib/items/item.builder';
import { getItemKey } from '../../lib/items/item.utils';
import type { CompromisedPasswordEntry } from '../../lib/monitor/types';
import { PassFeature } from '../../types/api/features';
import { ContentFormatVersion } from '../../types/crypto/pass-types';
import type { ItemRevision } from '../../types/data/items';
import { ItemState } from '../../types/data/items';
import type { State } from '../types';
import { selectCompromisedPasswordsReportCount } from './monitor';

const createMockItem = (password: string): ItemRevision<'login'> => ({
    aliasEmail: null,
    contentFormatVersion: ContentFormatVersion.Item,
    createTime: -1,
    data: itemBuilder('login').set('content', (content) => content.set('password', password)).data,
    flags: 0,
    folderId: null,
    itemId: uniqueId(),
    lastUseTime: null,
    modifyTime: -1,
    pinned: false,
    revision: 1,
    revisionTime: -1,
    shareId: 'shareId',
    state: ItemState.Active,
    shareCount: 0,
});

jest.mock('./items', () => ({
    ...jest.requireActual('./items'),
    selectVisibleLoginItems: (state: any) => state.mock.items,
}));

const mockState = (options: {
    enabled: boolean;
    lastSyncedChange: number;
    items: ItemRevision<'login'>[];
    cache?: Record<string, CompromisedPasswordEntry>;
}): State =>
    ({
        mock: { items: options.items },
        user: { features: { [PassFeature.PassCompromisedPasswords]: options.enabled } },
        compromisedPasswords: {
            lastSyncedChange: options.lastSyncedChange,
            items: options.cache ?? {},
            progress: { completed: 0, total: 0 },
        },
    }) as unknown as State;

describe('`selectCompromisedPasswordsReportCount`', () => {
    test('resolves to `null` when the feature flag is disabled, regardless of sync state', () => {
        const items = [createMockItem('AAA')];
        const cache = { [getItemKey(items[0])]: { compromised: true, etag: '', revision: 1 } };
        const state = mockState({ enabled: false, lastSyncedChange: 123, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toBeNull();
    });

    test('resolves to `null` when the feature flag is enabled but no sync has happened yet', () => {
        const items = [createMockItem('AAA')];
        const cache = { [getItemKey(items[0])]: { compromised: true, etag: '', revision: 1 } };
        const state = mockState({ enabled: true, lastSyncedChange: 0, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toBeNull();
    });

    test('resolves to the compromised count when enabled and synced', () => {
        const items = [createMockItem('AAA'), createMockItem('BBB'), createMockItem('CCC')];
        const cache = {
            [getItemKey(items[0])]: { compromised: true, etag: '', revision: 1 },
            [getItemKey(items[1])]: { compromised: false, etag: '', revision: 1 },
            [getItemKey(items[2])]: { compromised: true, etag: '', revision: 1 },
        };
        const state = mockState({ enabled: true, lastSyncedChange: 123, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toEqual(2);
    });

    test('resolves to `0` when enabled and synced but nothing is compromised', () => {
        const items = [createMockItem('AAA')];
        const state = mockState({ enabled: true, lastSyncedChange: 123, items, cache: {} });
        expect(selectCompromisedPasswordsReportCount()(state)).toEqual(0);
    });
});
