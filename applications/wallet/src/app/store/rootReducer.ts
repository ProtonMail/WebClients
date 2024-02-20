import { combineReducers } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store';

import { walletReducers } from './slices';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...walletReducers,
});
