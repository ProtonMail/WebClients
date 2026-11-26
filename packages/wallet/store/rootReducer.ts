import { combineReducers } from '@reduxjs/toolkit';

import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

import { walletReducers } from './slices';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...walletReducers,
    ...offersDeliveryReducer,
});
