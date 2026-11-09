import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { renderHook, waitFor } from '@testing-library/react'

import * as packageSheetsEditor from '@proton-docs/sheets-editor'
import { reportErrorToSentry } from '../../../../Utils/errorMessage'
import { useSheetsEditorSource } from './use-sheets-editor-source'

jest.mock('@proton-docs/sheets-editor', () => ({
  SheetsDependenciesProvider: jest.fn(),
  StandaloneSheetsEditor: jest.fn(),
  resolveDefaultWorkbookLocale: jest.fn(),
}))
jest.mock('@proton-docs/sheets-editor/style.css', () => ({}))
jest.mock('../../../../Utils/errorMessage', () => ({ reportErrorToSentry: jest.fn() }))

function createClientInvoker() {
  const reportUserInterfaceError = jest.fn().mockResolvedValue(undefined)
  return {
    clientInvoker: { reportUserInterfaceError } as unknown as EditorRequiresClientMethods,
    reportUserInterfaceError,
  }
}

describe('useSheetsEditorSource', () => {
  afterEach(() => {
    jest.clearAllMocks()
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
    jest.resetModules()
    jest.doMock('@proton-docs/sheets-editor/style.css', () => {
      throw error
    })
    const { clientInvoker, reportUserInterfaceError } = createClientInvoker()
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => expect(reportUserInterfaceError).toHaveBeenCalledWith(error, { irrecoverable: true }))
    expect(reportErrorToSentry).toHaveBeenCalledWith(error)
    expect(result.current).toBeUndefined()
  })
})
