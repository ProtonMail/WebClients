import { combineReducers } from '@reduxjs/toolkit';

import { domainsReducer, protonDomainsReducer } from '@proton/account';
import { sharedReducers } from '@proton/redux-shared-store';

import { walletReducers } from './slices';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...walletReducers,
    ...protonDomainsReducer,
    ...domainsReducer,
});
