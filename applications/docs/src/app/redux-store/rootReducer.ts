import { combineReducers } from '@reduxjs/toolkit'

import { breachesCountReducer } from '@proton/components'

import { selectPersistModel } from '@proton/redux-utilities'
import { sharedPersistReducer, sharedReducers } from '@proton/redux-shared-store'

export const rootReducer = combineReducers({
  ...sharedReducers,
  ...breachesCountReducer,
})

export type DocsState = ReturnType<typeof rootReducer>

export const persistReducer: Partial<{ [key in keyof DocsState]: any }> = {
  ...sharedPersistReducer,
  breachesCount: selectPersistModel,
}
