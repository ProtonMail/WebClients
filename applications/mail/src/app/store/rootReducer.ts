import { combineReducers } from '@reduxjs/toolkit';

import { conversationCountsReducer, filtersReducer, messageCountsReducer } from '@proton/mail';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...filtersReducer,
    ...messageCountsReducer,
    ...conversationCountsReducer,
});
