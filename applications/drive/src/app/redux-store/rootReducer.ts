import { combineReducers } from '@reduxjs/toolkit';

import { breachesCountReducer } from '@proton/account';
import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...offersDeliveryReducer,
    ...breachesCountReducer,
});

export type DriveState = ReturnType<typeof rootReducer>;
