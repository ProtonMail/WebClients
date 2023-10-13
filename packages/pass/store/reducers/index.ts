import { type Reducer, combineReducers } from 'redux';

import { stateSync } from '@proton/pass/store/actions';
import { isStateResetAction } from '@proton/pass/store/actions/utils';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

import alias from './alias';
import importReducer from './import';
import invites from './invites';
import items from './items';
import popup from './popup';
import pwHistory from './pw-history';
import request from './request';
import settings from './settings';
import shares from './shares';
import user from './user';

export * from './alias';
export * from './import';
export * from './invites';
export * from './items';
export * from './popup';
export * from './pw-history';
export * from './request';
export * from './shares';
export * from './user';

export const reducerMap = {
    alias,
    import: importReducer,
    invites,
    items,
    popup,
    pwHistory,
    request,
    settings,
    shares,
    user,
};
export const rootReducer = combineReducers(reducerMap);

const wrappedRootReducer: Reducer<State> = (previousState, action) => {
    /* Certain actions act as `state` overrides :
     * - on `signout` or `stateLock` : reset to initial state
     * - on `stateSync` : merge the incoming state */
    return rootReducer(
        ((): Maybe<State> => {
            if (isStateResetAction(action)) return undefined;
            if (stateSync.match(action)) return merge(previousState ?? {}, action.payload.state);

            return previousState;
        })(),
        action
    );
};

export default wrappedRootReducer;
