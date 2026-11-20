import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import { ConfigContext } from '@proton/app-context/configContext'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'

import type { EditorInvoker } from '../__utils/EditorInvoker'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocumentHeaderV2 } from './DocumentHeaderV2'

// The user menu and the promo banner need the account store; the title menu has its own tests
vi.mock('@proton/components/containers/heading/UserDropdown', () => ({ default: () => <div>User menu</div> }))
vi.mock('~/components/document/DocumentViewer/WorkspacePromoBanner', () => ({ WorkspacePromoBanner: () => null }))
vi.mock('./DocumentTitleMenu', () => ({ DocumentTitleMenu: () => <div>Title menu</div> }))
const mockShowSharingModal = vi.fn()
vi.mock('@proton/drive/public/sharingModal', () => ({
  useSharingModal: () => ({ sharingModal: <div>Sharing modal</div>, showSharingModal: mockShowSharingModal }),
}))
const mockDrive = { name: 'drive' }
vi.mock('@proton/drive/sdk', () => ({ getDrive: () => mockDrive }))
vi.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger: { warn: vi.fn() } }) }))

// The atoms Tooltip's default open delay
const TOOLTIP_OPEN_DELAY_MS = 1000

describe('DocumentHeaderV2', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('links to Docs home, and holds the title menu and the user menu', () => {
    renderHeader('Editor')

    expect(screen.getByTestId('docs-home-link')).toHaveAttribute('href', 'http://docs.localhost')
    expect(screen.getByText('Title menu')).toBeInTheDocument()
    expect(screen.getByText('User menu')).toBeInTheDocument()
  })

  test('shows the status next to the title menu, before the view-only pill', () => {
    renderHeader('Viewer', <output>Saving…</output>)

    expect(screen.getByTestId('status-container')).toHaveTextContent(/^Saving…View only$/)
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

      vi.useFakeTimers()
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).hover(screen.getByTestId('comments-button-stub'))
      act(() => vi.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS))
      expect(screen.getByRole('tooltip')).toHaveTextContent('Comments are not available yet')
    },
  )

  // As /doc's ConnectionStatus: the pill shows for every role, while the Loader locks only non-admins
  test.each<DocumentRole>(['Viewer', 'Editor', 'Admin'])(
    'a %s sees the Limited availability pill from 20 users, and not below',
    (role) => {
      const { rerender } = render(headerWithParticipants(role, participants(19)))
      expect(screen.getByTestId('status-container')).not.toHaveTextContent('Limited availability')

      rerender(headerWithParticipants(role, participants(20)))
      expect(screen.getByTestId('status-container')).toHaveTextContent('Limited availability')

      rerender(headerWithParticipants(role, participants(19)))
      expect(screen.getByTestId('status-container')).not.toHaveTextContent('Limited availability')
    },
  )

  test("shows the users' avatars, and clicking one has the editor scroll to that user's cursor", async () => {
    const editorInvoker = {
      setTableOfContentsVisible: vi.fn(),
      getYDocAsJSON: vi.fn(),
      getCurrentEditorState: vi.fn(),
      syncEvent: vi.fn(async () => {}),
    }
    const users = participants(2)
    render(headerWithParticipants('Editor', users, editorInvoker))

    await userEvent.click(within(screen.getByTestId('active-users')).getAllByTestId('user-avatar')[1])

    expect(editorInvoker.syncEvent).toHaveBeenCalledWith({
      name: 'ScrollToUserCursorData',
      payload: { state: users[1].state },
    })
  })
})

describe('DocumentHeaderV2 sharing', () => {
  afterEach(() => vi.clearAllMocks())

  test('an Admin gets the Share button, which opens the Drive sharing modal on the document', async () => {
    renderHeader('Admin')

    await userEvent.click(screen.getByTestId('share-button'))

    expect(mockShowSharingModal).toHaveBeenCalledTimes(1)
    // No onShareSnapshot: sharing never rewrites the address bar to the public link
    expect(mockShowSharingModal).toHaveBeenCalledWith({ drive: mockDrive, nodeUid: 'VOLUME~LINK' })
    expect(screen.getByText('Sharing modal')).toBeInTheDocument()
  })

  test.each<DocumentRole>(['Editor', 'Viewer'])('a %s gets no Share button', (role) => {
    renderHeader(role)

    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })

  test('the Share button goes when the role drops from Admin', () => {
    const { rerender } = renderHeader('Admin')
    expect(screen.getByTestId('share-button')).toBeInTheDocument()

    rerender(headerElement('Editor'))

    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })
})

function renderHeader(role: DocumentRole, status?: ReactNode) {
  return render(headerElement(role, status))
}

function headerElement(role: DocumentRole, status?: ReactNode) {
  return (
    <ConfigContext.Provider value={{ APP_VERSION: '1.2.3', APP_NAME: 'proton-docs' } as ProtonConfig}>
      <DocumentHeaderV2
        node={{
          uid: 'VOLUME~LINK',
          parentUid: 'VOLUME~PARENT',
          name: { ok: true, value: 'Plans' },
          membership: undefined,
        }}
        role={role}
        participants={[]}
        editorInvoker={undefined}
        exportInvoker={undefined}
        wordCount={{ isShown: false, setIsShown: vi.fn() }}
        trashState="not_trashed"
        isCreatingSpreadsheet={false}
        isMakingACopy={false}
        onFileMenuAction={vi.fn()}
        status={status}
      />
    </ConfigContext.Provider>
  )
}

/** `count` users, one client each, the user's own first */
const participants = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    isSelf: index === 0,
    state: { name: `user ${index}`, color: 'hsl(0, 50%, 50%)', anchorPos: null, focusPos: null },
    lastSeenAt: 0,
  }))

function headerWithParticipants(
  role: DocumentRole,
  activeParticipants: ReturnType<typeof participants>,
  editorInvoker?: Pick<
    EditorInvoker,
    'setTableOfContentsVisible' | 'getYDocAsJSON' | 'getCurrentEditorState' | 'syncEvent'
  >,
) {
  return (
    <ConfigContext.Provider value={{ APP_VERSION: '1.2.3', APP_NAME: 'proton-docs' } as ProtonConfig}>
      <DocumentHeaderV2
        node={{
          uid: 'VOLUME~LINK',
          parentUid: 'VOLUME~PARENT',
          name: { ok: true, value: 'Plans' },
          membership: undefined,
        }}
        role={role}
        participants={activeParticipants}
        editorInvoker={editorInvoker}
        exportInvoker={undefined}
        wordCount={{ isShown: false, setIsShown: vi.fn() }}
        trashState="not_trashed"
        isCreatingSpreadsheet={false}
        isMakingACopy={false}
        onFileMenuAction={vi.fn()}
      />
    </ConfigContext.Provider>
  )
}
