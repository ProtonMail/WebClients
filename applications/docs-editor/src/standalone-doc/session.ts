import { DocState } from '@proton/docs-shared/lib/Doc/DocState'
import type { EditorInitializationConfig, SafeDocsUserState } from '../app/Containers/Docs/public'

const docStateLogger = {
  // eslint-disable-next-line no-console
  debug: console.debug.bind(console),
  // eslint-disable-next-line no-console
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  getLogs: () => '',
  downloadLogs: () => {},
  clearLogs: () => {},
  setEnabled: () => {},
}

const fixture = `# Standalone Docs

This document lives in memory. Reload to reset it.

Try **formatting**, undo and redo, links, lists, and tables.

- No login or Drive is required.
- No API or realtime server is required.
`

export function createStandaloneDocSession(onReady: () => void, onError: (error: unknown) => void) {
  let loaded = false
  let destroyed = false
  let awarenessStates: SafeDocsUserState[] = []
  const awarenessSubscribers = new Set<(states: SafeDocsUserState[]) => void>()
  const documentId = 'standalone-doc'
  // Use the production DocState for awareness, undo propagation, and queued updates.
  // Outbound transport terminates here; there is no websocket or parent bridge.
  const docState = new DocState(
    {
      docStateRequestsPropagationOfUpdate: (message) => docStateLogger.debug('Standalone update', message.type.wrapper),
      handleAwarenessStateUpdate: (states) => {
        if (destroyed) {
          return
        }
        awarenessStates = states
        awarenessSubscribers.forEach((callback) => callback(states))
      },
      handleErrorWhenReceivingDocumentUpdate: onError,
      handleReceivedEverythingFromRTS: () => {},
    },
    docStateLogger,
  )
  // Lexical must bind to the same Doc as DocState, rather than create its own.
  const docMap = new Map([[documentId, docState.getDoc()]])
  const initialization: EditorInitializationConfig = {
    mode: 'conversion',
    data: new TextEncoder().encode(fixture),
    type: { docType: 'doc', dataType: 'md' },
  }

  const destroy = () => {
    if (destroyed) {
      return
    }
    destroyed = true
    awarenessSubscribers.clear()
    docState.destroy()
    docState.getDoc().destroy()
    docMap.clear()
  }

  return {
    documentId,
    docState,
    docMap,
    initialization,
    logger: docStateLogger,
    subscribeToAwarenessStates(callback: (states: SafeDocsUserState[]) => void) {
      if (destroyed) {
        return () => {}
      }
      awarenessSubscribers.add(callback)
      callback(awarenessStates)
      return () => {
        awarenessSubscribers.delete(callback)
      }
    },
    editorLoaded() {
      if (loaded || destroyed) {
        return
      }
      loaded = true
      docState.onEditorReadyToReceiveUpdates()
      onReady()
    },
    attachPageLifecycle() {
      const onPageHide = (event: PageTransitionEvent) => {
        if (!event.persisted) {
          destroy()
        }
      }
      window.addEventListener('pagehide', onPageHide)
      return () => {
        window.removeEventListener('pagehide', onPageHide)
        destroy()
      }
    },
    destroy,
  }
}
