import { combineReducers } from '@reduxjs/toolkit'

import { breachesCountReducer } from '@proton/account/breaches/breachNotificationsSlice'
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store/sharedReducers'
import { selectPersistModel } from '@proton/redux-utilities/creator'

export const rootReducer = combineReducers({
  ...sharedReducers,
  ...breachesCountReducer,
})

export type DocsState = ReturnType<typeof rootReducer>

export const persistReducer: Partial<{ [key in keyof DocsState]: any }> = {
  ...sharedPersistReducer,
  breachesCount: selectPersistModel,
}
