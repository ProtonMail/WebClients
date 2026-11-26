import { combineReducers } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';

import { meetReducers } from './slices';

export const meetRootReducers = {
    ...sharedReducers,
    ...meetReducers,
};

export const rootReducer = combineReducers(meetRootReducers);

export type MeetState = ReturnType<typeof rootReducer>;
