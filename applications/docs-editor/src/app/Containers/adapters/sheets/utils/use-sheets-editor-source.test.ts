import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { renderHook, waitFor } from '@testing-library/react'

import * as packageSheetsEditor from '@proton-docs/sheets-editor'
import * as localSheetsEditor from '../../../Spreadsheet/public'
import { reportErrorToSentry } from '../../../../Utils/errorMessage'
import { useSheetsEditorSource } from './use-sheets-editor-source'

jest.mock('@proton-docs/sheets-editor', () => ({
  SheetsDependenciesProvider: jest.fn(),
  StandaloneSheetsEditor: jest.fn(),
}))
jest.mock('@proton-docs/sheets-editor/style.css', () => ({}))
jest.mock('../../../Spreadsheet/public', () => ({
  SheetsDependenciesProvider: jest.fn(),
  StandaloneSheetsEditor: jest.fn(),
}))
jest.mock('../../../../Utils/errorMessage', () => ({ reportErrorToSentry: jest.fn() }))

function createClientInvoker(
  checkIfFeatureFlagIsEnabled: EditorRequiresClientMethods['checkIfFeatureFlagIsEnabled'],
): EditorRequiresClientMethods {
  return { checkIfFeatureFlagIsEnabled } as EditorRequiresClientMethods
}

describe('useSheetsEditorSource', () => {
  it('does not resolve a source until enabled', () => {
    const checkIfFeatureFlagIsEnabled = jest.fn().mockResolvedValue(true)
    const { result } = renderHook(() => useSheetsEditorSource(createClientInvoker(checkIfFeatureFlagIsEnabled), false))

    expect(result.current).toBeUndefined()
    expect(checkIfFeatureFlagIsEnabled).not.toHaveBeenCalled()
  })

  it('uses the container editor when the flag is disabled', async () => {
    const clientInvoker = createClientInvoker(jest.fn().mockResolvedValue(false))
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => {
      expect(result.current?.StandaloneSheetsEditor).toBe(localSheetsEditor.StandaloneSheetsEditor)
    })
  })

  it('loads the package editor when the flag is enabled', async () => {
    const clientInvoker = createClientInvoker(jest.fn().mockResolvedValue(true))
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => {
      expect(result.current?.StandaloneSheetsEditor).toBe(packageSheetsEditor.StandaloneSheetsEditor)
    })
    expect(result.current?.SheetsDependenciesProvider).toBe(packageSheetsEditor.SheetsDependenciesProvider)
  })

  it('reports a failure and falls back to the container editor', async () => {
    const error = new Error('Flag request failed')
    const clientInvoker = createClientInvoker(jest.fn().mockRejectedValue(error))
    const { result } = renderHook(() => useSheetsEditorSource(clientInvoker, true))

    await waitFor(() => {
      expect(result.current?.StandaloneSheetsEditor).toBe(localSheetsEditor.StandaloneSheetsEditor)
    })
    expect(reportErrorToSentry).toHaveBeenCalledWith(error)
  })
})
