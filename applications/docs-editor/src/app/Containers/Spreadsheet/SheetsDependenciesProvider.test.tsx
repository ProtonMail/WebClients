import { render, screen } from '@testing-library/react'
import { SheetsDependenciesProvider, useSheetsMessages, type SheetsDependencies } from './SheetsDependenciesProvider'
import type { SheetsMessages } from './messages/SheetsMessages'
import { CircleLoader, circleLoaderMessages } from './components/CircleLoader/CircleLoader'

// These consumers only read the loader group; no host catalogs are needed.
const englishMessages = circleLoaderMessages as SheetsMessages
const translatedMessages = { circleLoader: { Loading: 'Chargement' } } as SheetsMessages

function dependencies(messages: SheetsMessages): SheetsDependencies {
  const action = async () => {}
  return {
    messages,
    receivedEverythingFromRTS: true,
    userName: 'Test',
    isDevOrBlack: () => false,
    canEdit: true,
    canTrash: true,
    versionInfo: { environment: undefined, version: 'test' },
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    appPlatform: null,
    theme: 'light',
    localization: { uiLocale: 'en-us', defaultWorkbookLocale: 'en-us' },
    featureFlags: {
      SheetsActionsStorageEnabled: false,
      SheetsCustomDateTimeFormatEnabled: false,
      SheetsCustomNumberFormatEnabled: false,
      SheetsDriftDetectionEnabled: false,
      SheetsODSExportEnabled: false,
      SheetsPatchesStorageEnabled: false,
      SheetsStatusBarEnabled: false,
      SheetsTablesEnabled: false,
    },
    subscribeToSheetImport: () => () => {},
    subscribeToCollaboratorCursorNavigation: () => () => {},
    openLink: action,
    fileMenuActions: {
      createSpreadsheet: action,
      createDocument: action,
      import: action,
      makeCopy: action,
      moveToFolder: action,
      viewVersionHistory: action,
      moveToTrash: action,
      print: action,
      download: action,
      openHelp: action,
      viewRecentSpreadsheets: action,
      openProtonDrive: action,
      toggleDebugMode: action,
    },
    storeSpreadsheetAction: () => {},
    storeSpreadsheetPatches: () => {},
    hasBasePatchesStored: async () => false,
    showNotification: () => {},
    showGenericInfoModal: () => {},
    reloadClient: () => {},
    reportUserInterfaceError: () => {},
    reportError: () => {},
    reportSheetsYjsDriftDetected: () => {},
    showYjsDriftDetectedErrorModal: () => {},
  }
}
it('refreshes an editor component when dependency messages change', () => {
  const { rerender } = render(
    <SheetsDependenciesProvider dependencies={dependencies(englishMessages)}>
      <CircleLoader />
    </SheetsDependenciesProvider>,
  )
  expect(screen.getByText('Loading')).toBeTruthy()
  rerender(
    <SheetsDependenciesProvider dependencies={dependencies(translatedMessages)}>
      <CircleLoader />
    </SheetsDependenciesProvider>,
  )
  expect(screen.getByText('Chargement')).toBeTruthy()
})

// Compiled by the app typecheck; this function is deliberately not executed.
function typecheckContract(messages: SheetsMessages) {
  // @ts-expect-error Supplying an empty object must not silently fall back to English.
  const missing: SheetsMessages = {}
  // @ts-expect-error Nested fields are required as well.
  const partial: SheetsMessages = { ...messages, menus: { file: 'File' } }
  // @ts-expect-error Formatters require a number.
  messages.columns('2')
  const { toolbar, ...withoutToolbar } = messages
  // @ts-expect-error Entire groups are mandatory when supplying messages.
  const incomplete: SheetsMessages = withoutToolbar
  return { missing, partial, toolbar, incomplete }
}
void typecheckContract

it('fails clearly when message dependencies are missing', () => {
  function HostConsumer() {
    return <span>{useSheetsMessages().menus.file}</span>
  }
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    expect(() => render(<HostConsumer />)).toThrow(
      'Sheets requires messages from a host provider or the standalone English entry.',
    )
  } finally {
    error.mockRestore()
  }
})
