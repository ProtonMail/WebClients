import '../app/style'
import './standalone-doc.css'
import NotificationsChildren from '@proton/components/containers/notifications/Children'
import NotificationsProvider from '@proton/components/containers/notifications/Provider'
import { DocAwarenessEvent, EditorSystemMode } from '@proton/docs-shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LexicalEditor } from 'lexical'
import { createRoot } from 'react-dom/client'
import { ApplicationProvider } from '../app/Containers/ApplicationProvider'
import {
  DocsDependenciesProvider,
  StandaloneDocsEditor,
  type DocsDependencies,
  type EditorProps,
} from '../app/Containers/Docs/public'
import DocsLayout from '../app/Containers/DocsLayout'
import { EditorStateProvider, useEditorState } from '../app/Containers/EditorStateProvider'
import { Application } from '../app/Lib/Application'
import { EditorUserMode } from '../app/Lib/EditorUserMode'
import { ThemeStyles } from '../app/Theme'
import { EditorThemeProvider, useEditorTheme } from '../app/Theme/EditorThemeProvider'
import { useStore } from 'zustand'
import { createStandaloneDocClient } from './client'
import { createStandaloneDocSession } from './session'

document.title = 'Standalone Docs'

function createLocalApplication() {
  const application = new Application()
  application.setRole('Editor')
  application.syncedState.setProperty('userName', 'Standalone developer')
  application.syncedState.setProperty('suggestionsEnabled', false)
  return application
}

function StandaloneDoc({ application }: { application: Application }) {
  const { theme, setTheme } = useEditorTheme()
  const { userMode, setUserMode, editorHidden, setEditorHidden, editingLocked, setEditingLocked } =
    useStore(useEditorState())
  const [message, setMessage] = useState('Loading fixture…')
  const [failed, setFailed] = useState(false)
  const editorRef = useRef<LexicalEditor | null>(null)
  const setEditorRef = useCallback((editor: LexicalEditor | null) => {
    editorRef.current = editor
  }, [])
  const reportUnavailable = useCallback((action: string) => {
    setMessage(`${action} is unavailable in standalone mode.`)
  }, [])
  const reportError = useCallback((error: unknown, lockEditor = false) => {
    console.error(error)
    setMessage(String(error))
    if (lockEditor) {
      setFailed(true)
    }
  }, [])
  const onEditorError = useCallback<EditorProps['onEditorError']>((error) => reportError(error, true), [reportError])
  const onEditorLoadError = useCallback((message: string) => reportError(new Error(message), true), [reportError])
  const [session] = useState(() =>
    createStandaloneDocSession(
      () => {
        application.syncedState.setProperty('receivedEverythingFromRTS', true)
        setEditorHidden(false)
        setEditingLocked(false)
        setMessage('In memory · Reload to reset')
      },
      (error) => reportError(error, true),
      (states) => application.eventBus.publish({ type: DocAwarenessEvent.AwarenessStateChange, payload: { states } }),
    ),
  )
  useEffect(() => {
    const dispose = () => session.destroy()
    window.addEventListener('pagehide', dispose)
    return () => {
      window.removeEventListener('pagehide', dispose)
      dispose()
    }
  }, [session])
  const clientInvoker = useMemo(
    () => createStandaloneDocClient(reportUnavailable, reportError),
    [reportUnavailable, reportError],
  )
  const dependencies = useMemo<DocsDependencies>(
    () => ({
      logger: application.logger,
      reportError: (error) => reportError(error),
      isDevOrBlack: () => true,
      openLink: (url) => {
        clientInvoker.openLink(url).catch(reportError)
      },
      showGenericAlertModal: clientInvoker.showGenericAlertModal,
      createSuggestionThread: clientInvoker.createSuggestionThread,
      getAllThreads: clientInvoker.getAllThreads,
      reopenSuggestion: clientInvoker.reopenSuggestion,
      rejectSuggestion: clientInvoker.rejectSuggestion,
      getDocumentUrl: clientInvoker.getDocumentUrl,
      replaceDocumentUrl: clientInvoker.replaceDocumentUrl,
      reportTelemetry: (event) => {
        clientInvoker.editorReportingTelemetry(event).catch(reportError)
      },
    }),
    [application.logger, clientInvoker, reportError],
  )
  const onEditorReadyToReceiveUpdates = useCallback(() => session.editorLoaded(), [session])
  const changeMode = useCallback(
    (mode: EditorUserMode) => {
      if (mode === EditorUserMode.Suggest) {
        reportUnavailable('suggestion mode')
        return
      }
      setUserMode(mode)
    },
    [reportUnavailable, setUserMode],
  )

  return (
    <>
      <header className="standalone-doc-header">
        <strong>Standalone Docs</strong>
        <output>{message}</output>
        <label>
          Mode
          <select value={userMode} onChange={(event) => changeMode(event.target.value as EditorUserMode)}>
            <option value={EditorUserMode.Edit}>Edit</option>
            <option value={EditorUserMode.Preview}>View</option>
          </select>
        </label>
        <label>
          Theme
          <select value={theme} onChange={(event) => setTheme(event.target.value === 'dark' ? 'dark' : 'light')}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </header>
      <main className="standalone-doc-editor">
        <DocsDependenciesProvider dependencies={dependencies}>
          <DocsLayout.Container isSuggestionMode={false}>
            <StandaloneDocsEditor
              clientInvoker={clientInvoker}
              docMap={session.docMap}
              docState={session.docState}
              documentId={session.documentId}
              editingLocked={editingLocked || failed || userMode === EditorUserMode.Preview}
              role={application.getRole()}
              onEditorError={onEditorError}
              hidden={editorHidden}
              editorInitializationConfig={session.initialization}
              systemMode={EditorSystemMode.Edit}
              userMode={userMode}
              onEditorReadyToReceiveUpdates={onEditorReadyToReceiveUpdates}
              onEditorLoadError={onEditorLoadError}
              onUserModeChange={changeMode}
              setEditorRef={setEditorRef}
              userAddress="standalone@example.test"
              isSuggestionsFeatureEnabled={false}
              showTreeView={false}
              tableOfContentsVisible={false}
            />
          </DocsLayout.Container>
        </DocsDependenciesProvider>
      </main>
    </>
  )
}

function StandaloneDocRoot() {
  const [application] = useState(createLocalApplication)
  const initialTheme = new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light'

  return (
    <EditorThemeProvider initialTheme={initialTheme}>
      <ThemeStyles />
      {/* These existing providers are temporary until Docs' runtime dependencies are injected. */}
      <ApplicationProvider application={application}>
        <EditorStateProvider systemMode={EditorSystemMode.Edit}>
          <NotificationsProvider>
            <StandaloneDoc application={application} />
            <NotificationsChildren />
          </NotificationsProvider>
        </EditorStateProvider>
      </ApplicationProvider>
    </EditorThemeProvider>
  )
}

createRoot(document.querySelector('.app-root')!).render(<StandaloneDocRoot />)
