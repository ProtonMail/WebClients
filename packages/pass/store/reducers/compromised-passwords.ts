import type { Reducer } from 'redux';

import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { compromisedPasswordUpdate, compromisedPasswordsSync } from '@proton/pass/store/actions';
import { objectDelete } from '@proton/pass/utils/object/delete';

export type CompromisedPasswordsState = Record<string, true>;

const reducer: Reducer<CompromisedPasswordsState> = (state = {}, action) => {
    if (compromisedPasswordsSync.match(action)) {
        return Object.fromEntries(action.payload.map((item) => [getItemKey(item), true as const]));
    }

    if (compromisedPasswordUpdate.match(action)) {
        const key = getItemKey(action.payload.item);
        if (action.payload.compromised) return { ...state, [key]: true };
        return objectDelete(state, key);
    }

    return state;
};

export default reducer;
