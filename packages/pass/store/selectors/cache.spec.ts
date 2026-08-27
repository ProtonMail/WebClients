import { SyncStrategy } from '../../lib/sync/types';
import type { Invite } from '../../types';
import { InviteType } from '../../types';
import { uniqueId } from '../../utils/string/unique-id';
import { default as rootReducer } from '../reducers';
import type { State } from '../types';
import { selectCachableState } from './cache';

const stateFor = (syncStrategy: SyncStrategy): State => {
    const base = rootReducer(undefined, { type: '__INIT__' });
    return {
        ...base,
        settings: { ...base.settings, syncStrategy },
        invites: { [uniqueId()]: { type: InviteType.User } as Invite },
        monitor: { custom: [], preview: [], proton: [], customDomains: false, total: 0 },
    };
};

describe('selectCachableState', () => {
    test('caches invites and monitor under `SyncStrategy.USER_EVENTS`', () => {
        const state = stateFor(SyncStrategy.USER_EVENTS);
        const cachable = selectCachableState(state);
        expect(cachable.invites).toEqual(state.invites);
        expect(cachable.monitor).toEqual(state.monitor);
    });

    test('clears invites and monitor under `SyncStrategy.LEGACY`', () => {
        const cachable = selectCachableState(stateFor(SyncStrategy.LEGACY));
        expect(cachable.invites).toEqual({});
        expect(cachable.monitor).toBeNull();
    });

    test('never caches `assignedModelId`', () => {
        const state = { ...stateFor(SyncStrategy.USER_EVENTS), assignedModelId: '2026.10.1-lr' };
        expect(selectCachableState(state).assignedModelId).toBeNull();
    });

    test('never caches `ui`', () => {
        const state = { ...stateFor(SyncStrategy.USER_EVENTS), ui: { values: { key: true } } };
        expect(selectCachableState(state).ui).toEqual({ values: {} });
    });

    test('never caches `compromisedPasswords.progress`, but keeps `lastSyncedChange`/`items`', () => {
        const base = stateFor(SyncStrategy.USER_EVENTS);
        const state = {
            ...base,
            compromisedPasswords: {
                lastSyncedChange: 1234,
                items: { key: { compromised: true, etag: '', lastChangeAtCheck: 1234, revision: 1 } },
                progress: { completed: 7, total: 20 },
            },
        };

        const cachable = selectCachableState(state);
        expect(cachable.compromisedPasswords.progress).toEqual({ completed: 0, total: 0 });
        expect(cachable.compromisedPasswords.lastSyncedChange).toEqual(1234);
        expect(cachable.compromisedPasswords.items).toEqual(state.compromisedPasswords.items);
    });
});
