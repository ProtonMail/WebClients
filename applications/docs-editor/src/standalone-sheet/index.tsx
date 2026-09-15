import '../app/style'
import './standalone-sheet.css'
import { EditorSystemMode, type FileMenuAction } from '@proton/docs-shared'
import { createRoot } from 'react-dom/client'
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import {
  SheetsDependenciesProvider,
  StandaloneSheetsEditor,
  type SheetsDependencies,
} from '../app/Containers/Spreadsheet/public'
import { ThemeStyles } from '../app/Theme'
import { EditorThemeProvider, useEditorTheme } from '../app/Theme/EditorThemeProvider'
import { createStandaloneSession, standaloneLogger } from './session'

document.title = 'Standalone Sheet'

function describeFileAction(action: FileMenuAction) {
  return action.type === 'download' ? `download ${action.format}` : action.type.replaceAll('-', ' ')
}

function StandaloneSheet() {
  const { theme } = useEditorTheme()
  const [ready, setReady] = useState(false)
  const [migrationEditingLocked, setMigrationEditingLocked] = useState(false)
  const [errorLocked, setErrorLocked] = useState(false)
  const [message, setMessage] = useState('Loading fixture…')
  const publishError = useCallback((error: unknown) => {
    console.error(error)
    setMessage(String(error))
  }, [])
  const [session] = useState(() =>
    createStandaloneSession(() => {
      setReady(true)
      setMessage('In memory · Reload to reset · A2 × B2 = C2')
    }, publishError),
  )
  useEffect(() => {
    const dispose = () => session.destroy()
    window.addEventListener('pagehide', dispose)
    return () => {
      window.removeEventListener('pagehide', dispose)
      dispose()
    }
  }, [session])
  const dependencies = useMemo<SheetsDependencies>(
    () => ({
      receivedEverythingFromRTS: ready,
      userName: 'Standalone developer',
      canEdit: true,
      canTrash: false,
      isDevOrBlack: () => true,
      versionInfo: { environment: undefined, version: 'standalone' },
      logger: standaloneLogger,
      appPlatform: null,
      theme,
      subscribeToSheetImport: () => () => {},
      subscribeToCollaboratorCursorNavigation: () => () => {},
      isFeatureFlagEnabled: async () => false,
      openLink: async (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      handleFileMenuAction: async (action) => {
        setMessage(
          `File action triggered: ${describeFileAction(action)}. This action is unavailable in standalone mode.`,
        )
      },
      storeSpreadsheetAction: () => {},
      storeSpreadsheetPatches: () => {},
      hasBasePatchesStored: async () => false,
      showNotification: ({ text }) => setMessage(text),
      showGenericInfoModal: ({ title, translatedMessage }) => window.alert(`${title}\n\n${translatedMessage}`),
      reloadClient: () => window.location.reload(),
      reportUserInterfaceError: (error, extraInfo) => {
        if (extraInfo?.lockEditor) {
          setErrorLocked(true)
        }
        publishError(error)
      },
      reportError: (error) => publishError(error),
      reportSheetsYjsDriftDetected: (reason) => publishError(new Error(reason)),
      showYjsDriftDetectedErrorModal: (details) => publishError(new Error(JSON.stringify(details))),
    }),
    [ready, publishError, theme],
  )
  const onEditorLoadResult = useCallback<ComponentProps<typeof StandaloneSheetsEditor>['onEditorLoadResult']>(
    (result) => {
      if (result.isFailed()) {
        setErrorLocked(true)
        publishError(result.getTranslatedError())
        return
      }
      session.editorLoaded()
    },
    [session, publishError],
  )
  const updateLocalStateToLog = useCallback((state: unknown) => {
    standaloneLogger.debug('Workbook state', state as object)
  }, [])
  return (
    <>
      <header className="standalone-sheet-header">
        <strong>Standalone Sheet</strong>
        <output>{message}</output>
      </header>
      <main className="standalone-sheet-editor">
        <SheetsDependenciesProvider dependencies={dependencies}>
          <StandaloneSheetsEditor
            docState={session.docState}
            hidden={!ready}
            editingLocked={!ready || migrationEditingLocked || errorLocked}
            setMigrationEditingLocked={setMigrationEditingLocked}
            systemMode={EditorSystemMode.Edit}
            isPublicMode={false}
            editorInitializationConfig={undefined}
            onEditorLoadResult={onEditorLoadResult}
            updateLocalStateToLog={updateLocalStateToLog}
          />
        </SheetsDependenciesProvider>
      </main>
    </>
  )
}

function StandaloneSheetRoot() {
  const initialTheme = new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light'

  return (
    <EditorThemeProvider initialTheme={initialTheme}>
      <ThemeStyles />
      <StandaloneSheet />
    </EditorThemeProvider>
  )
}

createRoot(document.querySelector('.app-root')!).render(<StandaloneSheetRoot />)
