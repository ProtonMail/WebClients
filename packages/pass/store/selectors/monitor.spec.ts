import uniqueId from 'lodash/uniqueId';

import { itemBuilder } from '../../lib/items/item.builder';
import { getItemKey } from '../../lib/items/item.utils';
import type { CompromisedPasswordEntry } from '../../lib/monitor/types';
import { MonitorCheckType } from '../../lib/monitor/types';
import { PassFeature } from '../../types/api/features';
import { ContentFormatVersion } from '../../types/crypto/pass-types';
import type { ItemRevision } from '../../types/data/items';
import { ItemFlag, ItemState } from '../../types/data/items';
import { createTestItem } from '../../utils/tests/fixtures/items';
import type { State } from '../types';
import type * as ItemsSelectorsModule from './items';
import {
    selectCompromisedPasswordsReportCount,
    selectExcludedItems,
    selectLoginsEligibleForMonitorCheck,
    selectMonitoredLogins,
} from './monitor';

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

jest.mock('./items', () => {
    const actualItems = jest.requireActual('./items') as typeof ItemsSelectorsModule;

    return {
        ...actualItems,
        selectVisibleLoginItems: (state: State) => {
            const mockedItems = (state as State & { mock?: { items: ItemRevision<'login'>[] } }).mock?.items;
            if (mockedItems) return mockedItems;

            return actualItems.selectVisibleLoginItems(state);
        },
    };
});

const mockCompromisedState = (options: {
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
        const state = mockCompromisedState({ enabled: false, lastSyncedChange: 123, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toBeNull();
    });

    test('resolves to `null` when the feature flag is enabled but no sync has happened yet', () => {
        const items = [createMockItem('AAA')];
        const cache = { [getItemKey(items[0])]: { compromised: true, etag: '', revision: 1 } };
        const state = mockCompromisedState({ enabled: true, lastSyncedChange: 0, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toBeNull();
    });

    test('resolves to the compromised count when enabled and synced', () => {
        const items = [createMockItem('AAA'), createMockItem('BBB'), createMockItem('CCC')];
        const cache = {
            [getItemKey(items[0])]: { compromised: true, etag: '', revision: 1 },
            [getItemKey(items[1])]: { compromised: false, etag: '', revision: 1 },
            [getItemKey(items[2])]: { compromised: true, etag: '', revision: 1 },
        };
        const state = mockCompromisedState({ enabled: true, lastSyncedChange: 123, items, cache });
        expect(selectCompromisedPasswordsReportCount()(state)).toEqual(2);
    });

    test('resolves to `0` when enabled and synced but nothing is compromised', () => {
        const items = [createMockItem('AAA')];
        const state = mockCompromisedState({ enabled: true, lastSyncedChange: 123, items, cache: {} });
        expect(selectCompromisedPasswordsReportCount()(state)).toEqual(0);
    });
});

const shareId = 'share-1';

const mockLogin = (itemId: string, flags = 0) =>
    createTestItem('login', {
        itemId,
        shareId,
        flags,
    });

const mockPerCheckState = (items: ReturnType<typeof mockLogin>[], perCheckExclusionEnabled = false): State =>
    ({
        items: {
            byShareId: { [shareId]: Object.fromEntries(items.map((item) => [item.itemId, item])) },
            byOptimisticId: {},
            drafts: [],
            secureLinks: {},
        },
        shares: { [shareId]: { shareId } },
        sharesDedupe: { dedupe: [shareId], dedupeAndVisible: [shareId] },
        user: {
            features: {
                [PassFeature.PassMonitorPerCheckExclusion]: perCheckExclusionEnabled,
            },
        },
        compromisedPasswords: { items: {}, lastSyncedChange: 0, progress: { completed: 0, total: 0 } },
    }) as unknown as State;

describe('monitor selectors', () => {
    test('`selectMonitoredLogins` keeps legacy global exclusion when FF is off', () => {
        const monitored = mockLogin('monitored');
        const globallyExcluded = mockLogin('excluded', ItemFlag.SkipHealthCheck);
        const weakIgnored = mockLogin('weak-ignored', ItemFlag.SkipWeakPasswordCheck);
        const state = mockPerCheckState([monitored, globallyExcluded, weakIgnored], false);

        const itemIds = selectMonitoredLogins()(state).map((item) => item.itemId);
        expect(itemIds).toEqual(['monitored', 'weak-ignored']);
    });

    test('`selectLoginsEligibleForMonitorCheck` respects per-check skip when FF is on', () => {
        const monitored = mockLogin('monitored');
        const weakIgnored = mockLogin('weak-ignored', ItemFlag.SkipWeakPasswordCheck);
        const twoFaIgnored = mockLogin('two-fa-ignored', ItemFlag.Skip2FACheck);
        const state = mockPerCheckState([monitored, weakIgnored, twoFaIgnored], true);

        const weakIds = selectLoginsEligibleForMonitorCheck(MonitorCheckType.WEAK)(state).map((item) => item.itemId);
        const twoFaIds = selectLoginsEligibleForMonitorCheck(MonitorCheckType.MISSING_2FA)(state).map((item) => item.itemId);

        expect(weakIds).toEqual(['monitored', 'two-fa-ignored']);
        expect(twoFaIds).toEqual(['monitored', 'weak-ignored']);
    });

    test('`selectLoginsEligibleForMonitorCheck` excludes globally excluded items when FF is on', () => {
        const globallyExcluded = mockLogin('excluded', ItemFlag.SkipHealthCheck);
        const state = mockPerCheckState([globallyExcluded], true);

        expect(selectLoginsEligibleForMonitorCheck(MonitorCheckType.WEAK)(state)).toHaveLength(0);
    });

    test('`selectExcludedItems` uses global exclusion only when FF is off', () => {
        const globallyExcluded = mockLogin('excluded', ItemFlag.SkipHealthCheck);
        const weakIgnored = mockLogin('weak-ignored', ItemFlag.SkipWeakPasswordCheck);
        const state = mockPerCheckState([globallyExcluded, weakIgnored], false);

        expect(selectExcludedItems()(state).map((item) => item.itemId)).toEqual(['excluded']);
    });

    test('`selectExcludedItems` includes partial exclusions when FF is on', () => {
        const monitored = mockLogin('monitored');
        const weakIgnored = mockLogin('weak-ignored', ItemFlag.SkipWeakPasswordCheck);
        const globallyExcluded = mockLogin('excluded', ItemFlag.SkipHealthCheck);
        const state = mockPerCheckState([monitored, weakIgnored, globallyExcluded], true);

        expect(
            selectExcludedItems()(state)
                .map((item) => item.itemId)
                .sort()
        ).toEqual(['excluded', 'weak-ignored']);
    });
});
