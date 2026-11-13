import { SyncStrategy } from '../../lib/sync/types';
import type { Invite } from '../../types/data/invites';
import { InviteType } from '../../types/data/invites';
import { uniqueId } from '../../utils/string/unique-id';
import { folderDelete } from '../actions/creators/folders';
import { setUIStateValue } from '../actions/creators/ui';
import { vaultDeleteSuccess } from '../actions/creators/vault';
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

    test('never caches `ui.session`', () => {
        const state = { ...stateFor(SyncStrategy.USER_EVENTS), ui: { session: { noteExpanded: { itemKey: false } }, persisted: {} } };
        expect(selectCachableState(state).ui.session).toEqual({});
    });

    test('caches `ui.persisted.menuExpanded` only for vaults and folders that still exist', () => {
        let state: State = {
            ...stateFor(SyncStrategy.USER_EVENTS),
            shares: { shareId: {} as any, deletedShareId: {} as any },
            folders: { shareId: { folderId: {} as any, deletedFolderId: {} as any } },
        };

        ['shareId', 'deletedShareId', 'folderId', 'deletedFolderId'].forEach((key) => {
            state = rootReducer(state, setUIStateValue({ namespace: 'menuExpanded', key, value: true, persist: true }));
        });

        state = rootReducer(state, vaultDeleteSuccess('vault-delete', { shareId: 'deletedShareId', content: {} as any }));
        state = rootReducer(state, folderDelete.success('folder-delete', { shareId: 'shareId', folderIds: ['deletedFolderId'] }));

        expect(selectCachableState(state).ui.persisted.menuExpanded).toEqual({ shareId: true, folderId: true });
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
