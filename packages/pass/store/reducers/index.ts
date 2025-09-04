import { type Reducer, combineReducers } from 'redux';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { stateDestroy, stateHydrate } from '@proton/pass/store/actions';
import request from '@proton/pass/store/request/reducer';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';

import { access } from './access';
import alias from './alias';
import files from './files';
import filters from './filters';
import importReducer from './import';
import invites from './invites';
import items from './items';
import monitor from './monitor';
import notification from './notification';
import organization from './organization';
import pwHistory from './pw-history';
import settings from './settings';
import { shares } from './shares';
import user from './user';

export * from './access';
export * from './alias';
export * from './files';
export * from './filters';
export * from './import';
export * from './invites';
export * from './items';
export * from './monitor';
export * from './pw-history';
export * from './shares';
export * from './user';

export const reducerMap = {
    access,
    alias,
    files,
    filters,
    import: importReducer,
    invites,
    items,
    monitor,
    notification,
    organization,
    pwHistory,
    request,
    settings,
    shares,
    user,
};
export const rootReducer = combineReducers(reducerMap);

const wrappedRootReducer: Reducer<State> = (previousState, action) => {
    /* Certain actions act as `state` overrides :
     * - on `stateDestroy` : reset to initial state */
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
