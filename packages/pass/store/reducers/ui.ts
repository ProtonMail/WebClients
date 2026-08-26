import type { Action, Reducer } from 'redux';

import { objectDelete } from '../../utils/object/delete';
import { setUIStateValue, unsetUIStateValue } from '../actions/creators/ui';

/** Keep to JSON-serializable primitives : values cross the popup/worker
 * port boundary. Deliberately excluded from the persisted cache */
export type UIStateValue = boolean | number | string;
export type UIState = { values: Record<string, UIStateValue> };

const getInitialState = (): UIState => ({ values: {} });

const uiReducer: Reducer<UIState> = (state = getInitialState(), action: Action) => {
    if (setUIStateValue.match(action)) {
        return { values: { ...state.values, [action.payload.key]: action.payload.value } };
    }

    if (unsetUIStateValue.match(action)) {
        return { values: objectDelete(state.values, action.payload.key) };
    }

    return state;
};

export default uiReducer;
