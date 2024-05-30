import { combineReducers } from '@reduxjs/toolkit';

import { breachesCountReducer } from '@proton/components/components/drawer/views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
import { sharedReducers } from '@proton/redux-shared-store';

export const rootReducer = combineReducers({
    ...sharedReducers,
    ...breachesCountReducer,
});
