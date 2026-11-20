import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { renderHook, waitFor } from '@testing-library/react'

import * as packageSheetsEditor from '@proton-docs/sheets-editor'
import { reportErrorToSentry } from '../../../../Utils/errorMessage'
import { useSheetsEditorSource } from './use-sheets-editor-source'

vi.mock('@proton-docs/sheets-editor', () => ({
  SheetsDependenciesProvider: vi.fn(),
  StandaloneSheetsEditor: vi.fn(),
  resolveDefaultWorkbookLocale: vi.fn(),
}))
vi.mock('@proton-docs/sheets-editor/style.css', () => ({}))
vi.mock('../../../../Utils/errorMessage', () => ({ reportErrorToSentry: vi.fn() }))

function createClientInvoker() {
  const reportUserInterfaceError = vi.fn().mockResolvedValue(undefined)
  return {
    clientInvoker: { reportUserInterfaceError } as unknown as EditorRequiresClientMethods,
    reportUserInterfaceError,
  }
}

// Vitest wraps an error thrown by a mock factory and keeps the original as `cause`.
const thrownBy = (error: Error) => expect.objectContaining({ cause: error })

describe('useSheetsEditorSource', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not load the editor until enabled', async () => {
    const { clientInvoker } = createClientInvoker()
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, false))

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current).toBeUndefined()
  })

  it('loads the package editor', async () => {
    const { clientInvoker } = createClientInvoker()
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => {
      expect(result.current?.StandaloneSheetsEditor).toBe(packageSheetsEditor.StandaloneSheetsEditor)
    })
    expect(result.current?.SheetsDependenciesProvider).toBe(packageSheetsEditor.SheetsDependenciesProvider)
    expect(result.current?.resolveDefaultWorkbookLocale).toBe(packageSheetsEditor.resolveDefaultWorkbookLocale)
  })

  it('reports a failed load as irrecoverable and resolves no editor', async () => {
    const error = new Error('Loading chunk failed')
    vi.resetModules()
    vi.doMock('@proton-docs/sheets-editor/style.css', () => {
      throw error
    })
    const { clientInvoker, reportUserInterfaceError } = createClientInvoker()
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => expect(reportUserInterfaceError).toHaveBeenCalledWith(thrownBy(error), { irrecoverable: true }))
    expect(reportErrorToSentry).toHaveBeenCalledWith(thrownBy(error))
    expect(result.current).toBeUndefined()
  })
})
