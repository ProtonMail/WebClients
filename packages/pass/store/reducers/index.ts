import { type Reducer, combineReducers } from 'redux';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { stateDestroy, stateHydrate } from '@proton/pass/store/actions';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';

import alias from './alias';
import importReducer from './import';
import invites from './invites';
import items from './items';
import organization from './organization';
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
    organization,
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
     * - on `stateDestroy` : reset to initial state
     * - on `stateSync` : merge the incoming state */
    return rootReducer(
        ((): Maybe<State> => {
            if (stateDestroy.match(action)) {
                PassCrypto?.clear();
                return undefined;
            }

            if (stateHydrate.match(action)) return action.payload.state;

            return previousState;
        })(),
        action
    );
};

export default wrappedRootReducer;
