import type { Reducer } from 'redux';

import { MAX_PASSWORD_HISTORY_RETENTION_WEEKS } from '../../constants';
import type { MaybeNull } from '../../types';
import { UNIX_WEEK } from '../../utils/time/constants';
import { getEpoch } from '../../utils/time/epoch';
import { passwordDelete, passwordHistoryClear, passwordHistoryGarbageCollect, passwordSave } from '../actions/creators/password';

export type PasswordHistoryEntry = {
    id: string;
    value: string;
    origin: MaybeNull<string>;
    createTime: number;
};

export type PasswordItem = Omit<PasswordHistoryEntry, 'createTime' | 'id'>;

export type PasswordHistoryState = PasswordHistoryEntry[];

const reducer: Reducer<PasswordHistoryState> = (state = [], action) => {
    if (passwordSave.match(action)) return [action.payload, ...state];
    if (passwordDelete.match(action)) return state.filter(({ id }) => id !== action.payload.id);
    if (passwordHistoryClear.match(action)) return [];

    if (passwordHistoryGarbageCollect.match(action)) {
        const limit = getEpoch() - UNIX_WEEK * MAX_PASSWORD_HISTORY_RETENTION_WEEKS;
        return state.filter(({ createTime }) => createTime > limit);
    }

    return state;
};

export default reducer;
