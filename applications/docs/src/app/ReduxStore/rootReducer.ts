import { combineReducers } from '@reduxjs/toolkit'

import { sharedReducers } from '@proton/redux-shared-store'
import { breachesCountReducer } from '@proton/components/components/drawer/views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice'

export const rootReducer = combineReducers({
  ...sharedReducers,
  ...breachesCountReducer,
})
