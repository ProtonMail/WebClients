import type { Action, Reducer } from 'redux';

import type { ImportReport } from '../../lib/import/helpers/report';
import type { MaybeNull } from '../../types';
import { importReport } from '../actions';

export type ImportState = MaybeNull<ImportReport>;

const importReducer: Reducer<ImportState> = (state = null, action: Action) => {
    if (importReport.match(action)) return action.payload.report;
    return state;
};

export default importReducer;
