import type { EditorControllerInterface } from '@proton/docs-core/EditorController/EditorController'
import type { DocumentState } from '@proton/docs-core/State/DocumentState'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugMenu } from './DebugMenu'

vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: vi.fn() }),
}))

const SPREADSHEET_STATE = { sheets: [{ sheetId: 1 }] }

function renderSpreadsheetMenu() {
  const editorController = {
    getDocumentClientId: vi.fn(async () => 1),
    replaceLocalSpreadsheetState: vi.fn(async () => {}),
  }
  const application = {} as ApplicationProviderProps['application']
  render(
    <DebugMenu
      editorController={editorController as unknown as EditorControllerInterface}
      documentState={{} as DocumentState}
      documentType="sheet"
    />,
    { wrapper: ({ children }) => <ApplicationProvider application={application}>{children}</ApplicationProvider> },
  )
  return { editorController }
}

async function applySpreadsheetStateFromFile() {
  const file = new File([JSON.stringify(SPREADSHEET_STATE)], 'state.json', { type: 'application/json' })
  // jsdom's File has no text().
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(SPREADSHEET_STATE) })
  await userEvent.upload(screen.getByTestId('apply-spreadsheet-state-input'), file)
}

describe('DebugMenu', () => {
  it('applies a spreadsheet state from a file without persisting it by default', async () => {
    const { editorController } = renderSpreadsheetMenu()
    await userEvent.click(screen.getByTestId('debug-menu-button'))

    expect(screen.getByTestId('persist-applied-spreadsheet-state-input')).not.toBeChecked()
    await applySpreadsheetStateFromFile()

    await waitFor(() =>
      expect(editorController.replaceLocalSpreadsheetState).toHaveBeenCalledWith(SPREADSHEET_STATE, false),
    )
  })

  it('persists the applied spreadsheet state when the toggle is on', async () => {
    const { editorController } = renderSpreadsheetMenu()
    await userEvent.click(screen.getByTestId('debug-menu-button'))

    await userEvent.click(screen.getByTestId('persist-applied-spreadsheet-state-input'))
    await applySpreadsheetStateFromFile()

    await waitFor(() =>
      expect(editorController.replaceLocalSpreadsheetState).toHaveBeenCalledWith(SPREADSHEET_STATE, true),
    )
  })
})
