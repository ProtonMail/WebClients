import { startSharedListening } from '@proton/redux-shared-store/sharedListeners'

import { startAccountSessionsListener } from '@proton/account/accountSessions'
import { startPersistListener } from '@proton/account/persist/listener'
import type { DocsState } from './rootReducer'
import type { AppStartListening } from './store'

export function start({
  startListening,
  persistTransformer,
}: {
  startListening: AppStartListening
  persistTransformer?: (state: DocsState) => any
}) {
  startSharedListening(startListening)
  if (persistTransformer) {
    startPersistListener(startListening, persistTransformer)
  }
  startAccountSessionsListener(startListening)
}
