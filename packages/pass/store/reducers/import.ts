import type { AnyAction, Reducer } from 'redux';

import type { ImportProvider } from '@proton/pass/import';
import type { MaybeNull } from '@proton/pass/types';

import { importItemsSuccess } from '../actions';

export type ImportEntry = {
    importedAt: number;
    total: number;
    ignored: string[];
    warnings?: string[];
    provider: ImportProvider;
};
export type ImportState = MaybeNull<ImportEntry>;

const importReducer: Reducer<ImportState> = (state = null, action: AnyAction) => {
    if (importItemsSuccess.match(action)) {
        return action.payload;
    }

    return state;
};

export default importReducer;
