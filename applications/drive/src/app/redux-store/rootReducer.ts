import { combineReducers } from '@reduxjs/toolkit';

import { breachesCountReducer } from '@proton/components';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...breachesCountReducer,
});
