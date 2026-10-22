import { DocumentRole } from '@proton/docs-shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LexicalEditor } from 'lexical'
import { createRoot } from 'react-dom/client'
import {
  defaultDocsMessages,
  DocsDependenciesProvider,
  DocsLayoutContainer,
  EditorSystemMode,
  EditorUserMode,
  StandaloneDocsEditor,
  type DocsDependencies,
  type EditorProps,
} from '../app/Containers/Docs/public'
import { ThemeStyles } from '../app/Theme'
import { EditorThemeProvider, useEditorTheme } from '../app/Theme/EditorThemeProvider'
import { createStandaloneDocClient } from './client'
import { createStandaloneDocSession } from './session'
// Keep these last so Tailwind utilities override component styles such as `.button`.
import '../app/style'
import './standalone-doc.css'

document.title = 'Standalone Docs'

const userAddress = 'standalone@example.test'

function StandaloneDoc() {
  const { theme, setTheme } = useEditorTheme()
  const [userMode, setUserMode] = useState(EditorUserMode.Edit)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Loading fixture…')
  const [failed, setFailed] = useState(false)
  const [role] = useState(() => new DocumentRole('Editor'))
  const editorRef = useRef<LexicalEditor | null>(null)
  const setEditorRef = useCallback((editor: LexicalEditor | null) => {
    editorRef.current = editor
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
        setReady(true)
        setMessage('In memory · Reload to reset')
      },
      (error) => reportError(error, true),
    ),
  )
  useEffect(() => session.attachPageLifecycle(), [session])
  const [comments] = useState(() => createStandaloneDocClient(userAddress, session.subscribeToAwarenessStates))
  const dependencies = useMemo<DocsDependencies>(
    () => ({
      userName: 'Standalone developer',
      defaultMessages: defaultDocsMessages,
      suggestionsEnabled: true,
      isAlpha: true,
      canEdit: role.canEdit(),
      canComment: role.canComment(),
      languageCode: 'en',
      dateFormat: { localeCode: 'en-US', hourCycle: 'h12' },
      getDisplayNameForEmail: (email) => email ?? 'Anonymous',
      comments,
      logger: session.logger,
      reportError: (error) => reportError(error),
      openLink: (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      showGenericAlertModal: (message) => window.alert(message),
      createWarningNotification: setMessage,
      createInfoNotification: setMessage,
      showAlert: (title, message) => window.alert(`${title}\n\n${message}`),
      reportToolbarInteraction: () => {},
      reportWordCount: () => {},
      subscribeToCollaboratorCursorNavigation: () => () => {},
      createSuggestionThread: comments.createSuggestionThread,
      getAllThreads: comments.getAllThreads,
      reopenSuggestion: comments.reopenSuggestion,
      rejectSuggestion: comments.rejectSuggestion,
      getDocumentUrl: async () => window.location.href,
      replaceDocumentUrl: async (url) => window.history.replaceState(null, '', url),
      reportTelemetry: () => {},
    }),
    [comments, role, session, reportError],
  )
  const onEditorReadyToReceiveUpdates = useCallback(() => session.editorLoaded(), [session])

  return (
    <>
      <header className="standalone-doc-header">
        <strong>Standalone Docs</strong>
        <output>{message}</output>
        <label>
          Mode
          <select value={userMode} onChange={(event) => setUserMode(event.target.value as EditorUserMode)}>
            <option value={EditorUserMode.Edit}>Edit</option>
            <option value={EditorUserMode.Suggest}>Suggest</option>
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
          <DocsLayoutContainer isSuggestionMode={userMode === EditorUserMode.Suggest}>
            <StandaloneDocsEditor
              docMap={session.docMap}
              docState={session.docState}
              documentId={session.documentId}
              editingLocked={!ready || failed || userMode === EditorUserMode.Preview}
              onEditorError={onEditorError}
              hidden={!ready}
              editorInitializationConfig={session.initialization}
              systemMode={EditorSystemMode.Edit}
              userMode={userMode}
              onEditorReadyToReceiveUpdates={onEditorReadyToReceiveUpdates}
              onEditorLoadError={onEditorLoadError}
              onUserModeChange={setUserMode}
              setEditorRef={setEditorRef}
              userAddress={userAddress}
              isSuggestionsFeatureEnabled
              showTreeView={false}
              tableOfContentsVisible
            />
          </DocsLayoutContainer>
        </DocsDependenciesProvider>
      </main>
    </>
  )
}

function StandaloneDocRoot() {
  const initialTheme = new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light'

  return (
    <EditorThemeProvider initialTheme={initialTheme}>
      <ThemeStyles />
      <StandaloneDoc />
    </EditorThemeProvider>
  )
}

createRoot(document.querySelector('.app-root')!).render(<StandaloneDocRoot />)
