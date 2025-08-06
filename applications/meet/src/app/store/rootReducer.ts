import { combineReducers } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store';

import { meetReducers } from './slices';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...meetReducers,
});
