import { SyncStrategy } from '@proton/pass/lib/sync/types';
import { default as rootReducer } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { Invite } from '@proton/pass/types';
import { InviteType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

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

    test('never caches `ui`', () => {
        const state = { ...stateFor(SyncStrategy.USER_EVENTS), ui: { values: { key: true } } };
        expect(selectCachableState(state).ui).toEqual({ values: {} });
    });
});
