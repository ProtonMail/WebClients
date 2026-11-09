import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import type { EditorOrchestratorInterface } from '@proton/docs-core/Services/Orchestrator/EditorOrchestratorInterface'
import type { YjsState } from '@proton/docs-shared/YjsState'

import { SingleRevisionViewer } from './SingleRevisionViewer'

const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
const bridges: { orchestrator: EditorOrchestratorInterface }[] = []

jest.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger }) }))
jest.mock('@proton/app-context/useConfig', () => ({ __esModule: true, useConfig: () => ({ APP_VERSION: '1.0.0' }) }))
jest.mock('@proton/components/containers/themes/ThemeProvider', () => ({
  useTheme: () => ({ information: { dark: false } }),
}))
jest.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => false }))
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }))
// The bridge's own messaging is covered elsewhere; this captures the orchestrator the viewer hands it.
jest.mock('@proton/docs-core/Bridge/ClientToEditorBridge', () => ({
  ClientToEditorBridge: jest
    .fn()
    .mockImplementation((_frame: HTMLIFrameElement, orchestrator: EditorOrchestratorInterface) => {
      bridges.push({ orchestrator })
      const call = () => Promise.resolve()
      return {
        logger: { setEnabled: jest.fn() },
        editorInvoker: { initializeEditor: call, receiveMessage: call, showEditor: call, setDarkMode: call },
      }
    }),
}))
jest.mock('../../../EditorFrame', () => ({
  EditorFrame: ({ onFrameReady }: { onFrameReady: (frame: HTMLIFrameElement) => void }) => {
    useEffect(() => {
      void onFrameReady(document.createElement('iframe'))
    }, [onFrameReady])
    return <div data-testid="editor-frame" />
  },
}))

/**
 * What the bridge's request handler does with the editor's `reportUserInterfaceError` call: it hands the
 * message to the orchestrator the viewer gave the bridge.
 */
async function reportFromEditor(message: string, extraInfo: { irrecoverable?: boolean }) {
  const { orchestrator } = bridges[bridges.length - 1]
  await act(async () => {
    orchestrator.editorReportingError(message, extraInfo)
  })
}

describe('SingleRevisionViewer', () => {
  afterEach(() => {
    bridges.length = 0
    jest.clearAllMocks()
  })

  it('replaces the editor with an error when the editor reports an irrecoverable error', async () => {
    render(
      <SingleRevisionViewer state={new Uint8Array() as YjsState} onEditorInvokerRef={jest.fn()} documentType="sheet" />,
    )
    expect(screen.getByTestId('editor-frame')).toBeInTheDocument()

    await reportFromEditor('Loading chunk failed', { irrecoverable: true })

    expect(screen.getByRole('alert')).toHaveTextContent('This version could not be loaded.')
    expect(screen.queryByTestId('editor-frame')).not.toBeInTheDocument()
    // Logged locally without the message, which may quote document content: `logger.error` would send it to Sentry.
    expect(logger.warn).toHaveBeenCalledWith('Revision editor reported an error', { irrecoverable: true })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('keeps the editor for a recoverable error', async () => {
    render(
      <SingleRevisionViewer state={new Uint8Array() as YjsState} onEditorInvokerRef={jest.fn()} documentType="sheet" />,
    )

    await reportFromEditor('Something minor', {})

    expect(screen.getByTestId('editor-frame')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
