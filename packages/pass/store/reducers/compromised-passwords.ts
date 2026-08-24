import type { Reducer } from 'redux';

import { getItemKey } from '../../lib/items/item.utils';
import type { CompromisedPasswordEntry } from '../../lib/monitor/types';
import { compromisedPasswordUpdate, compromisedPasswordsSync } from '../actions';

export type CompromisedPasswordsState = {
    lastSyncedChange: EpochTimeStamp;
    items: Record<string, CompromisedPasswordEntry>;
};

const INITIAL_STATE: CompromisedPasswordsState = { lastSyncedChange: 0, items: {} };

const reducer: Reducer<CompromisedPasswordsState> = (state = INITIAL_STATE, action) => {
    if (compromisedPasswordsSync.match(action)) {
        const items = Object.fromEntries(action.payload.results.map(({ item, entry }) => [getItemKey(item), entry]));
        return { lastSyncedChange: action.payload.lastSyncedChange, items };
    }

    if (compromisedPasswordUpdate.match(action)) {
        const key = getItemKey(action.payload.item);
        return { ...state, items: { ...state.items, [key]: action.payload.entry } };
    }

    return state;
};

export default reducer;
