import type { Reducer } from 'redux';

import type { MaybeNull } from '../../types';
import { UNIX_DAY, getEpoch } from '../../utils/time';
import {
    passwordDelete,
    passwordHistoryClear,
    passwordHistoryGarbageCollect,
    passwordSave,
} from '../actions/creators/pw-history';

export type PasswordHistoryEntry = {
    id: string;
    value: string;
    origin: MaybeNull<string>;
    createTime: number;
};

export type PasswordHistoryState = PasswordHistoryEntry[];

const reducer: Reducer<PasswordHistoryState> = (state = [], action) => {
    if (passwordSave.match(action)) return [action.payload, ...state];
    if (passwordDelete.match(action)) return state.filter(({ id }) => id !== action.payload.id);
    if (passwordHistoryClear.match(action)) return [];

    if (passwordHistoryGarbageCollect.match(action)) {
        const limit = getEpoch() - UNIX_DAY;
        return state.filter(({ createTime }) => createTime > limit);
    }

    return state;
};

export default reducer;
