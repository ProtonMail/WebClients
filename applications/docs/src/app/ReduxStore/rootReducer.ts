import { combineReducers } from '@reduxjs/toolkit'

import { sharedReducers } from '@proton/redux-shared-store'
import { breachesCountReducer } from '@proton/components'

export const rootReducer = combineReducers({
  ...sharedReducers,
  ...breachesCountReducer,
})
