import { createRoot } from 'react-dom/client'
import '@proton/polyfill'
import { App } from './App'
import './style'
import ErrorBoundary from './ErrorBoundary'
import { sendErrorMessage } from './Utils/errorMessage'
import { BridgeOriginProvider, EDITOR_IFRAME_FOCUS_EVENT } from '@proton/docs-shared'

const searchParams = new URLSearchParams(window.location.search)

const isViewOnly = searchParams.get('viewOnly') === 'true'

// Global Error Listener that pushes Error messages to Sentry
window.addEventListener('error', (event: ErrorEvent) => {
  sendErrorMessage(new Error(event.message))
})

const container = document.querySelector('.app-root')
const root = createRoot(container!)
root.render(
  <ErrorBoundary>
    <App nonInteractiveMode={isViewOnly} />
  </ErrorBoundary>,
)

window.addEventListener('focus', () => {
  window.parent.postMessage(EDITOR_IFRAME_FOCUS_EVENT, BridgeOriginProvider.GetClientOrigin())
})

window.addEventListener('blur', () => {
  document.dispatchEvent(new CustomEvent('dropdownclose'))
})
