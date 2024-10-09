import { ErrorBoundary } from '@proton/components'
import { BridgeOriginProvider, EDITOR_IFRAME_FOCUS_EVENT } from '@proton/docs-shared'
import '@proton/polyfill'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './style'
import { sendErrorMessage } from './Utils/errorMessage'
import type { EditorSystemMode } from '@proton/docs-shared/lib/EditorSystemMode'

const searchParams = new URLSearchParams(window.location.search)

const systemMode = searchParams.get('mode')

// Global Error Listener that pushes Error messages to Sentry
window.addEventListener('error', (event: ErrorEvent) => {
  sendErrorMessage(new Error(event.message))
})

const container = document.querySelector('.app-root')
const root = createRoot(container!)
root.render(
  <ErrorBoundary
    onError={(error) => {
      sendErrorMessage(error)
    }}
  >
    <App systemMode={systemMode as EditorSystemMode} />
  </ErrorBoundary>,
)

window.addEventListener('focus', () => {
  window.parent.postMessage(EDITOR_IFRAME_FOCUS_EVENT, BridgeOriginProvider.GetClientOrigin())
})

window.addEventListener('blur', () => {
  document.dispatchEvent(new CustomEvent('dropdownclose'))
})
