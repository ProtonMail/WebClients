import type { Action, Reducer } from 'redux';

import type { ImportProvider } from '@proton/pass/lib/import/types';
import { importItems } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';

export type ImportEntry = {
    importedAt: number;
    total: number;
    ignored: string[];
    warnings?: string[];
    provider: ImportProvider;
};
export type ImportState = MaybeNull<ImportEntry>;

const importReducer: Reducer<ImportState> = (state = null, action: Action) => {
    if (importItems.success.match(action)) return action.payload.data;
    return state;
};

export default importReducer;
