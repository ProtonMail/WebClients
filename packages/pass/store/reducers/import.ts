import type { AnyAction, Reducer } from 'redux';

import { ImportProvider } from '@proton/pass/import';
import type { MaybeNull } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time';

import { importItemsSuccess } from '../actions';

export type ImportEntry = { importedAt: number; total: number; ignored: string[]; provider: ImportProvider };
export type ImportState = MaybeNull<ImportEntry>;

const importReducer: Reducer<ImportState> = (state = null, action: AnyAction) => {
    if (importItemsSuccess.match(action)) {
        return {
            importedAt: getEpoch(),
            total: action.payload.total,
            ignored: action.payload.ignored,
            provider: action.payload.provider,
        };
    }

    return state;
};

export default importReducer;
