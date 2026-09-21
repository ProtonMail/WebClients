import '../app/style'
import './standalone-sheet.css'
import { EditorSystemMode } from '@proton/docs-shared'
import { createRoot } from 'react-dom/client'
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import {
  SheetsDependenciesProvider,
  StandaloneSheetsEditor,
  type SheetsDependencies,
} from '../app/Containers/Spreadsheet/public'
import { ThemeStyles } from '../app/Theme'
import { EditorThemeProvider, useEditorTheme } from '../app/Theme/EditorThemeProvider'
import { createStandaloneSession } from './session'

document.title = 'Standalone Sheet'

function StandaloneSheet() {
  const { theme } = useEditorTheme()
  const [ready, setReady] = useState(false)
  const [migrationEditingLocked, setMigrationEditingLocked] = useState(false)
  const [errorLocked, setErrorLocked] = useState(false)
  const [message, setMessage] = useState('Loading fixture…')
  const reportUnavailableFileMenuAction = useCallback((action: string) => {
    setMessage(`File action triggered: ${action}. This action is unavailable in standalone mode.`)
    return Promise.resolve()
  }, [])
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
      canTrash: true,
      isDevOrBlack: () => true,
      versionInfo: { environment: undefined, version: 'standalone' },
      logger: {
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      },
      appPlatform: null,
      theme,
      subscribeToSheetImport: () => () => {},
      subscribeToCollaboratorCursorNavigation: () => () => {},
      isFeatureFlagEnabled: async () => false,
      openLink: async (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      fileMenuActions: {
        createSpreadsheet: () => reportUnavailableFileMenuAction('new spreadsheet'),
        createDocument: () => reportUnavailableFileMenuAction('new document'),
        import: () => reportUnavailableFileMenuAction('import'),
        makeCopy: () => reportUnavailableFileMenuAction('make a copy'),
        moveToFolder: () => reportUnavailableFileMenuAction('move to folder'),
        viewVersionHistory: () => reportUnavailableFileMenuAction('see version history'),
        moveToTrash: () => reportUnavailableFileMenuAction('move to trash'),
        print: () => reportUnavailableFileMenuAction('print'),
        download: (format) => reportUnavailableFileMenuAction(`download ${format}`),
        openHelp: () => reportUnavailableFileMenuAction('help'),
        viewRecentSpreadsheets: () => reportUnavailableFileMenuAction('view recent spreadsheets'),
        openProtonDrive: () => reportUnavailableFileMenuAction('open Proton Drive'),
        toggleDebugMode: () => reportUnavailableFileMenuAction('toggle debug mode'),
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
    [ready, publishError, reportUnavailableFileMenuAction, theme],
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
    console.info('Workbook state', state)
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
