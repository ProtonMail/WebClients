import { combineReducers } from 'redux';

import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

export const rootReducer = combineReducers({
    ...sharedReducers,
});
