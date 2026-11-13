import { type Reducer, combineReducers } from 'redux';

import { objectDelete } from '../../utils/object/delete';
import { setUIStateValue, unsetUIStateValue } from '../actions/creators/ui';

/** Keep to JSON-serializable primitives : values cross the popup/worker port boundary */
export type UIStateValue = boolean | number | string;
export type UIStateNamespace = 'menuExpanded' | 'noteExpanded';
type UIStateBucket = Partial<Record<UIStateNamespace, Record<string, UIStateValue>>>;

/** `session` is never cached. `persisted` is cached: see `selectCachableState` */
const createBucketReducer =
    (persist: boolean): Reducer<UIStateBucket> =>
    (state = {}, action) => {
        if (setUIStateValue.match(action) && action.payload.persist === persist) {
            const { namespace, key, value } = action.payload;
            return { ...state, [namespace]: { ...state[namespace], [key]: value } };
        }

        if (unsetUIStateValue.match(action) && action.payload.persist === persist) {
            const { namespace, key } = action.payload;
            return { ...state, [namespace]: objectDelete(state[namespace] ?? {}, key) };
        }

        return state;
    };

export default combineReducers({ session: createBucketReducer(false), persisted: createBucketReducer(true) });
