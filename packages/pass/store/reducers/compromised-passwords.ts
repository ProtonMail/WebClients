import type { Reducer } from 'redux';

import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { CompromisedPasswordEntry } from '@proton/pass/lib/monitor/types';
import {
    compromisedPasswordUpdate,
    compromisedPasswordsBatchUpdate,
    compromisedPasswordsProgress,
    compromisedPasswordsSync,
} from '@proton/pass/store/actions';

export type CompromisedPasswordsState = {
    lastSyncedChange: EpochTimeStamp;
    items: Record<string, CompromisedPasswordEntry>;
    progress: { completed: number; total: number };
};

const INITIAL_STATE: CompromisedPasswordsState = { lastSyncedChange: 0, items: {}, progress: { completed: 0, total: 0 } };

const reducer: Reducer<CompromisedPasswordsState> = (state = INITIAL_STATE, action) => {
    if (compromisedPasswordsSync.match(action)) {
        const items = Object.fromEntries(action.payload.results.map(({ item, entry }) => [getItemKey(item), entry]));
        return { ...state, lastSyncedChange: action.payload.lastSyncedChange, items };
    }

    if (compromisedPasswordUpdate.match(action)) {
        const key = getItemKey(action.payload.item);
        return { ...state, items: { ...state.items, [key]: action.payload.entry } };
    }

    if (compromisedPasswordsBatchUpdate.match(action)) {
        const updates = Object.fromEntries(action.payload.map(({ item, entry }) => [getItemKey(item), entry]));
        return { ...state, items: { ...state.items, ...updates } };
    }

    if (compromisedPasswordsProgress.match(action)) {
        return { ...state, progress: action.payload };
    }

    return state;
};

export default reducer;
