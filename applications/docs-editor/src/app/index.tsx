import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary'
import { BridgeOriginProvider } from '@proton/docs-shared/Bridge/BridgeOriginProvider'
import { EDITOR_IFRAME_FOCUS_EVENT } from '@proton/docs-shared/Bridge/EditorIframeFocusEvent'
import '@proton/polyfill'
import { createRoot } from 'react-dom/client'
import { RootContainer } from './Containers/RootContainer'
import { SyncBundleFail } from './Containers/SyncBundleFail'
import './style'
import { reportErrorToSentry } from './Utils/errorMessage'
import type { EditorSystemMode } from './Containers/Docs/public'
import type { DocumentType } from '@proton/docs-shared/BasicTypes'
import { syncBundle, SyncBundleResult } from './Utils/syncBundle'

const container = document.querySelector('.app-root')
const root = createRoot(container!)

const syncResult = syncBundle()
if (syncResult === SyncBundleResult.READY) {
  const searchParams = new URLSearchParams(window.location.search)
  const documentType = (searchParams.get('type') as DocumentType) || 'doc'
  const systemMode = searchParams.get('mode')

  // Global Error Listener that pushes Error messages to Sentry
  window.addEventListener('error', (event: ErrorEvent) => {
    reportErrorToSentry(new Error(event.message))
  })
  root.render(
    <ErrorBoundary
      onError={(error) => {
        reportErrorToSentry(error)
      }}
    >
      <RootContainer documentType={documentType} systemMode={systemMode as EditorSystemMode} />
    </ErrorBoundary>,
  )
  window.addEventListener('focus', () => {
    window.parent.postMessage(EDITOR_IFRAME_FOCUS_EVENT, BridgeOriginProvider.GetClientOrigin())
  })
  window.addEventListener('blur', () => {
    document.dispatchEvent(new CustomEvent('dropdownclose'))
  })
} else if (syncResult === SyncBundleResult.FAILED) {
  root.render(<SyncBundleFail />)
} else if (syncResult === SyncBundleResult.RELOADING) {
  // do nothing, wait for the page to reload
}
