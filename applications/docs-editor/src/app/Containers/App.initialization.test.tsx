import { act, render } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import type { ClientRequiresEditorMethods, DocumentType, EditorInitializationConfig } from '@proton/docs-shared'
import { EditorSystemMode } from '@proton/docs-shared'
import type { EditorConfig } from '../Lib/useBridge'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { App } from './App'
import { StandaloneDocsEditor } from './Docs/public'
import { EditorStateProvider } from './EditorStateProvider'

jest.mock('@proton/docs-shared', () => ({
  BridgeOriginProvider: { GetClientOrigin: () => 'http://localhost' },
  EDITOR_READY_POST_MESSAGE_EVENT: 'editor-ready',
  EditorSystemMode: { Edit: 'edit', Revision: 'revision', PublicView: 'public-view' },
}))
jest.mock('@proton/hooks/useEffectOnce', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@proton/account/bootstrap', () => ({ loadLocales: jest.fn() }))
jest.mock('../Lib/Bootstrap', () => ({ bootstrapEditorApp: jest.fn() }))
jest.mock('../config', () => ({ __esModule: true, default: {} }))
jest.mock('../locales', () => ({ __esModule: true, default: [] }))
jest.mock('../Hooks/useSyncedState', () => ({
  useSyncedState: () => ({ suggestionsEnabled: false, receivedEverythingFromRTS: false }),
}))
jest.mock('../Utils/errorMessage', () => ({ reportErrorToSentry: jest.fn() }))
jest.mock('../Theme/EditorThemeProvider', () => {
  const setTheme = jest.fn()
  return { useEditorTheme: () => ({ setTheme }) }
})
jest.mock('./Docs/Conversion/Exporter/ExportDataFromEditorState', () => ({ exportDataFromEditorState: jest.fn() }))
jest.mock('./Docs/PreviewModeEditor', () => ({ PreviewModeEditor: () => null }))
jest.mock('./Docs/public', () => ({ StandaloneDocsEditor: jest.fn(() => null) }))
jest.mock('./Spreadsheet/public', () => ({ StandaloneSheetsEditor: () => null }))
jest.mock('./adapters/docs/DocsAdapter', () => ({ DocsAdapter: ({ children }: { children: ReactNode }) => children }))
jest.mock('./adapters/sheets/SheetsAdapter', () => ({
  SheetsAdapter: ({ children }: { children: ReactNode }) => children,
}))
jest.mock('./DocsLayout', () => ({
  __esModule: true,
  default: { Container: ({ children }: { children: ReactNode }) => children },
}))
jest.mock('./SheetsLayout', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => children }))

function setup(documentType: DocumentType = 'doc') {
  const reportUserInterfaceError = jest.fn().mockResolvedValue(undefined)
  const clientInvoker = {
    reportUserInterfaceError,
    checkIfFeatureFlagIsEnabled: jest.fn().mockResolvedValue(true),
  }
  const bridgeState = {
    application: {
      logger: { info: jest.fn(), debug: jest.fn() },
      setRole: jest.fn(),
      setAppVersion: jest.fn(),
      getRole: () => ({ canEdit: () => true }),
    },
    bridge: {
      getClientInvoker: () => clientInvoker,
      setClientRequestHandler: jest.fn((_handler: ClientRequiresEditorMethods) => {}),
    },
    docState: { getDoc: jest.fn(() => ({})), setIsInConversionFromOtherFormat: jest.fn() },
    docMap: new Map(),
    editorConfig: { current: null as EditorConfig | null },
    didSetInitialConfig: false,
    setEditorConfig: jest.fn((config: EditorConfig) => {
      bridgeState.editorConfig.current = config
      bridgeState.didSetInitialConfig = true
    }),
  }

  const element = () => (
    <EditorStateProvider systemMode={EditorSystemMode.Edit}>
      <App
        documentType={documentType}
        systemMode={EditorSystemMode.Edit}
        bridgeState={bridgeState as unknown as ComponentProps<typeof App>['bridgeState']}
      />
    </EditorStateProvider>
  )
  const view = render(element())
  const handler = bridgeState.bridge.setClientRequestHandler.mock.calls[0][0]
  const initialize = async (config?: EditorInitializationConfig) => {
    await act(async () => {
      await handler.initializeEditor('document-id', 'user@example.com', 'Editor', false, '1.0', config)
    })
  }

  return { bridgeState, reportUserInterfaceError, initialize, rerender: () => view.rerender(element()) }
}

describe('App bridge initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    { docType: 'sheet', dataType: 'txt' },
    { docType: 'sheet', dataType: 'xlsx' },
    { docType: 'doc', dataType: 'xlsx' },
    { docType: 'doc', dataType: 'csv' },
    { docType: 'doc', dataType: 'tsv' },
    { docType: 'doc', dataType: 'ods' },
  ] as const)('reports unsupported $docType/$dataType to the host without initializing', async (type) => {
    const { bridgeState, reportUserInterfaceError, initialize, rerender } = setup()

    await initialize({ mode: 'conversion', data: new Uint8Array([1]), type })
    rerender()

    expect(reportUserInterfaceError).toHaveBeenCalledTimes(1)
    expect(reportUserInterfaceError).toHaveBeenCalledWith(
      new Error('Failed to import document due to unsupported file format.'),
      { irrecoverable: true },
    )
    expect(reportErrorToSentry).toHaveBeenCalledWith(reportUserInterfaceError.mock.calls[0][0])
    expect(bridgeState.setEditorConfig).not.toHaveBeenCalled()
    expect(bridgeState.editorConfig.current).toBeNull()
    expect(bridgeState.didSetInitialConfig).toBe(false)
    expect(bridgeState.docState.setIsInConversionFromOtherFormat).not.toHaveBeenCalled()
    expect(bridgeState.docMap.size).toBe(0)
    expect(bridgeState.application.setRole).not.toHaveBeenCalled()
    expect(StandaloneDocsEditor).not.toHaveBeenCalled()
  })

  it('passes a validated Docs conversion to the editor and preserves it across re-renders', async () => {
    const { bridgeState, reportUserInterfaceError, initialize, rerender } = setup()
    const data = new Uint8Array(new ArrayBuffer(8), 2, 4)
    const config = { mode: 'conversion', data, type: { docType: 'doc', dataType: 'txt' } } as const

    await initialize(config)

    const initialization = jest.mocked(StandaloneDocsEditor).mock.calls.at(-1)?.[0].editorInitializationConfig
    expect(initialization).toEqual(config)
    expect(initialization?.mode === 'conversion' && initialization.data).toBe(data)
    expect(bridgeState.setEditorConfig).toHaveBeenCalledWith({
      documentId: 'document-id',
      userAddress: 'user@example.com',
      editorInitializationConfig: config,
    })
    expect(bridgeState.docState.setIsInConversionFromOtherFormat).toHaveBeenCalledTimes(1)
    expect(reportUserInterfaceError).not.toHaveBeenCalled()

    const renderCount = jest.mocked(StandaloneDocsEditor).mock.calls.length
    rerender()
    expect(jest.mocked(StandaloneDocsEditor).mock.calls.length).toBeGreaterThan(renderCount)
    expect(jest.mocked(StandaloneDocsEditor).mock.calls.at(-1)?.[0].editorInitializationConfig).toBe(initialization)
  })

  it.each([undefined, { mode: 'creation' } as const])(
    'initializes an existing or newly created document',
    async (config) => {
      const { bridgeState, reportUserInterfaceError, initialize } = setup()
      await initialize(config)

      expect(jest.mocked(StandaloneDocsEditor).mock.calls.at(-1)?.[0].editorInitializationConfig).toEqual(config)
      expect(bridgeState.didSetInitialConfig).toBe(true)
      expect(bridgeState.docState.setIsInConversionFromOtherFormat).not.toHaveBeenCalled()
      expect(reportUserInterfaceError).not.toHaveBeenCalled()
    },
  )

  it('continues accepting spreadsheet conversions for Sheets', async () => {
    const { bridgeState, reportUserInterfaceError, initialize } = setup('sheet')
    const config = {
      mode: 'conversion',
      data: new Uint8Array([1]),
      type: { docType: 'sheet', dataType: 'xlsx' },
    } as const
    await initialize(config)

    expect(bridgeState.editorConfig.current?.editorInitializationConfig).toBe(config)
    expect(bridgeState.docState.setIsInConversionFromOtherFormat).toHaveBeenCalledTimes(1)
    expect(reportUserInterfaceError).not.toHaveBeenCalled()
  })
})
