import { type Reducer, combineReducers } from 'redux';

import type { Maybe } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp';
import { merge } from '@proton/pass/utils/object';

import { signout, stateDestroy, stateLock, stateSync } from '../actions';
import type { State } from '../types';
import alias from './alias';
import items from './items';
import request from './request';
import settings from './settings';
import shares from './shares';
import user from './user';

export * from './alias';
export * from './items';
export * from './request';
export * from './shares';
export * from './user';

export const reducerMap = { alias, items, request, settings, shares, user };
export const rootReducer = combineReducers(reducerMap);

const wrappedRootReducer: Reducer<State> = (previousState, action) => {
    /* Certain actions act as `state` overrides :
     * - on `signout` or `stateLock` : reset to initial state
     * - on `stateSync` : merge the incoming state */
    return rootReducer(
        ((): Maybe<State> => {
            if (or(stateDestroy.match, stateLock.match, signout.match)(action)) {
                return undefined;
            }

            if (stateSync.match(action)) {
                return merge(previousState ?? {}, action.payload.state);
            }

            return previousState;
        })(),
        action
    );
};

export default wrappedRootReducer;
