import type { Reducer } from 'redux';

import {
    passwordDelete,
    passwordHistoryClear,
    passwordHistoryGarbageCollect,
    passwordSave,
} from '@proton/pass/store/actions/creators/password';
import type { MaybeNull } from '@proton/pass/types';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

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
