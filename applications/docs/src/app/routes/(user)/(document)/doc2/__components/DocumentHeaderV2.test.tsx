import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'

import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocumentHeaderV2 } from './DocumentHeaderV2'

// The user menu and the promo banner need the account store; the title menu has its own tests
jest.mock('@proton/components/containers/heading/UserDropdown', () => () => <div>User menu</div>)
jest.mock('~/components/document/DocumentViewer/WorkspacePromoBanner', () => ({ WorkspacePromoBanner: () => null }))
jest.mock('./DocumentTitleMenu', () => ({ DocumentTitleMenu: () => <div>Title menu</div> }))

// The atoms Tooltip's default open delay
const TOOLTIP_OPEN_DELAY_MS = 1000

describe('DocumentHeaderV2', () => {
  afterEach(() => jest.useRealTimers())

  test('links to Docs home, and holds the title menu and the user menu', () => {
    renderHeader('Editor')

    expect(screen.getByTestId('docs-home-link')).toHaveAttribute('href', 'http://docs.localhost')
    expect(screen.getByText('Title menu')).toBeInTheDocument()
    expect(screen.getByText('User menu')).toBeInTheDocument()
  })

  test('a Viewer sees the view-only pill and no comments button', () => {
    renderHeader('Viewer')

    expect(screen.getByTestId('status-container')).toHaveTextContent('View only')
    expect(screen.queryByTestId('comments-button')).not.toBeInTheDocument()
  })

  test.each<DocumentRole>(['Editor', 'Admin'])(
    'a %s sees no view-only pill, and the comments button as a disabled stub with a tooltip',
    async (role) => {
      renderHeader(role)

      expect(screen.getByTestId('status-container')).not.toHaveTextContent('View only')
      expect(screen.getByTestId('comments-button')).toBeDisabled()

      jest.useFakeTimers()
      await userEvent
        .setup({ advanceTimers: jest.advanceTimersByTime })
        .hover(screen.getByTestId('comments-button-stub'))
      act(() => jest.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS))
      expect(screen.getByRole('tooltip')).toHaveTextContent('Comments are not available yet')
    },
  )
})

function renderHeader(role: DocumentRole) {
  render(
    <ConfigContext.Provider value={{ APP_VERSION: '1.2.3', APP_NAME: 'proton-docs' } as ProtonConfig}>
      <DocumentHeaderV2
        node={{ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT', name: { ok: true, value: 'Plans' } }}
        role={role}
        editorInvoker={undefined}
        wordCount={{ isShown: false, setIsShown: jest.fn() }}
        onFileMenuAction={jest.fn()}
      />
    </ConfigContext.Provider>,
  )
}
