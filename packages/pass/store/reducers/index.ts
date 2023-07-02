import { type Reducer, combineReducers } from 'redux';

import type { Maybe } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';

import { stateSync } from '../actions';
import { isStateResetAction } from '../actions/utils';
import type { State } from '../types';
import alias from './alias';
import importReducer from './import';
import items from './items';
import popup from './popup';
import pwHistory from './pw-history';
import request from './request';
import settings from './settings';
import shares from './shares';
import user from './user';

export * from './alias';
export * from './import';
export * from './items';
export * from './popup';
export * from './pw-history';
export * from './request';
export * from './shares';
export * from './user';

export const reducerMap = {
    alias,
    items,
    import: importReducer,
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
