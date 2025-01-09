import { startSharedListening } from '@proton/redux-shared-store/sharedListeners'
import { startAccountSessionsListener, startPersistListener } from '@proton/account'

import type { AppStartListening } from './store'
import type { DocsState } from './rootReducer'

export const start = ({
  startListening,
  persistTransformer,
}: {
  startListening: AppStartListening
  persistTransformer?: (state: DocsState) => any
}) => {
  startSharedListening(startListening)
  if (persistTransformer) {
    startPersistListener(startListening, persistTransformer)
  }
  startAccountSessionsListener(startListening)
}
