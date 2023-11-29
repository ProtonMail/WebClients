import { combineReducers } from '@reduxjs/toolkit';

import { filtersReducer } from '@proton/mail';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...filtersReducer,
});
