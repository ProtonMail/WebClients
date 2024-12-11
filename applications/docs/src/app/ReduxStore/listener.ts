import { startSharedListening } from '@proton/redux-shared-store/sharedListeners'

import type { AppStartListening } from './store'
import { startPersistListener } from '@proton/account/persist/listener'
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
}
