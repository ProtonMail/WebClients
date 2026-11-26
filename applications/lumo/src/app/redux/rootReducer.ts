import { combineReducers } from '@reduxjs/toolkit';

import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

import { lumoReducers } from './slices';

export const rootReducer = combineReducers({
    ...lumoReducers,
    ...sharedReducers,
    ...offersDeliveryReducer,
});
