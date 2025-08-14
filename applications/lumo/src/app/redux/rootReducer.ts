import { combineReducers } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store';

import { lumoReducers } from './slices';

export const rootReducer = combineReducers({
    ...lumoReducers,
    ...sharedReducers,
});
