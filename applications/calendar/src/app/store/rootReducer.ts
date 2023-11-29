import { combineReducers } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
});
