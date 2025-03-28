import type { Action, Reducer } from 'redux';

import type { ImportReport } from '@proton/pass/lib/import/helpers/report';
import { importReport } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';

export type ImportState = MaybeNull<ImportReport>;

const importReducer: Reducer<ImportState> = (state = null, action: Action) => {
    if (importReport.match(action)) return action.payload.report;
    return state;
};

export default importReducer;
