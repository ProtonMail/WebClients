import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RedirectAction } from '@proton/docs-shared/DocumentAction'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { setLocation } from '@proton/vitest-config/setLocation'

import type { DocumentRole } from '../__utils/getDocumentRole'
import { redirectToAccountSwitcher, redirectToSignUp } from '../__utils/publicRedirects'
import { useDocsBookmarks } from '../__utils/useDocsBookmarks'
import { PublicHeaderOptions, type PublicHeaderOptionsProps } from './PublicHeaderOptions'

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
vi.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger: mockLogger }) }))
const mockRemoveActionFromUrl = vi.fn()
vi.mock('~/utils/docs-url-bar', () => ({ useDocsUrlBar: () => ({ removeActionFromUrl: mockRemoveActionFromUrl }) }))
vi.mock('../__utils/publicRedirects')
vi.mock('../__utils/useDocsBookmarks')
const mockShowSignupFlowModal = vi.fn()

const addBookmark = vi.fn(async () => {})
const USER = { Email: 'visitor@proton.me', DisplayName: 'Visitor', Name: 'visitor' } as UserModel
const DEFAULT_ROLE: DocumentRole = 'Editor'
const DOCUMENT_LINK = { linkId: 'LINK', isSharedUrlAFolder: false, customPassword: undefined }

describe('PublicHeaderOptions', () => {
  beforeEach(() => {
    setLocation('https://docs.proton.dev/doc2?mode=open-url&token=TOKEN&linkId=LINK#urlPassword')
    mockBookmarks({ isAlreadyBookmarked: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('an anonymous visitor gets Create a copy, Save for later and Sign up, and no account switcher', async () => {
    renderOptions({ user: undefined })

    expect(screen.getByTestId('make-a-copy-button')).toHaveTextContent('Create a copy')
    expect(await saveForLaterButton()).toHaveTextContent('Save for later')
    expect(screen.getByTestId('public-view-sign-up-link')).toHaveTextContent('Sign up')
    expect(screen.queryByTestId('public-view-user-info')).not.toBeInTheDocument()
  })

  test('a signed-in visitor gets their account switcher in place of Sign up, returning to the link', async () => {
    renderOptions({ user: USER })

    expect(screen.queryByTestId('public-view-sign-up-link')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('public-view-user-info'))

    expect(redirectToAccountSwitcher).toHaveBeenCalledWith('TOKEN', 'LINK', 'urlPassword')
  })

  test('Sign up sends an anonymous visitor to sign up, back to the link', async () => {
    renderOptions({ user: undefined })

    await userEvent.click(screen.getByTestId('public-view-sign-up-link'))

    expect(redirectToSignUp).toHaveBeenCalledWith({
      action: undefined,
      token: 'TOKEN',
      linkId: 'LINK',
      email: '',
      urlPassword: 'urlPassword',
      openInNewTab: true,
    })
  })

  test('Create a copy is disabled until there is a copy to make', async () => {
    const { rerender } = renderOptions({ user: USER })
    expect(screen.getByTestId('make-a-copy-button')).toBeDisabled()

    const onCreateCopy = vi.fn()
    rerender(optionsElement({ user: USER, onCreateCopy }))
    await userEvent.click(screen.getByTestId('make-a-copy-button'))

    expect(onCreateCopy).toHaveBeenCalledTimes(1)
  })

  test("a viewer's once-only Create a copy spotlight waits until there is a copy to make, so a disabled button can't use it up", () => {
    localStorage.removeItem('tooltip-public-docs-make-copy')
    const { rerender } = renderOptions({ role: 'Viewer' })
    expect(localStorage.getItem('tooltip-public-docs-make-copy')).toBeNull()

    rerender(optionsElement({ role: 'Viewer', onCreateCopy: vi.fn() }))
    expect(localStorage.getItem('tooltip-public-docs-make-copy')).toBe('true')
  })

  test("Create a copy runs the page's copy, which handles an anonymous visitor's sign-up too", async () => {
    const onCreateCopy = vi.fn()
    renderOptions({ user: undefined, onCreateCopy })

    await userEvent.click(screen.getByTestId('make-a-copy-button'))

    expect(onCreateCopy).toHaveBeenCalledTimes(1)
    expect(mockShowSignupFlowModal).not.toHaveBeenCalled()
  })

  test('Save for later bookmarks the link for a signed-in visitor, and reads Open in Drive once saved', async () => {
    const { rerender } = renderOptions({ user: USER })

    await userEvent.click(await saveForLaterButton())
    expect(addBookmark).toHaveBeenCalledTimes(1)
    expect(useDocsBookmarks).toHaveBeenLastCalledWith({
      token: 'TOKEN',
      urlPassword: 'urlPassword',
      customPassword: 'custom',
      user: USER,
    })

    mockBookmarks({ isAlreadyBookmarked: true })
    rerender(optionsElement({ user: USER }))
    expect(await saveForLaterButton()).toHaveTextContent('Open in Drive')
  })

  test("an anonymous visitor's Save for later goes through the sign-up modal, coming back to bookmark", async () => {
    renderOptions({ user: undefined })

    await userEvent.click(await saveForLaterButton())

    expect(mockShowSignupFlowModal).toHaveBeenCalledWith({
      urlPassword: 'urlPassword',
      redirectAction: RedirectAction.Bookmark,
      openInNewTab: false,
    })
    expect(addBookmark).not.toHaveBeenCalled()
  })

  test('a link to a folder gets no Save for later, which would save the whole folder', () => {
    renderOptions({ user: USER, linkInfo: { ...DOCUMENT_LINK, isSharedUrlAFolder: true } })

    expect(screen.queryByTestId('public-options-dropdown-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('make-a-copy-button')).toBeInTheDocument()
  })

  test('an editor gets the comments button, disabled, as a public session has no comments; a viewer none', () => {
    const { rerender } = renderOptions({ role: 'Editor' })
    expect(screen.getByTestId('comments-button')).toBeDisabled()

    rerender(optionsElement({ role: 'Viewer' }))
    expect(screen.queryByTestId('comments-button')).not.toBeInTheDocument()
  })

  describe('back from sign-in, the action in the address', () => {
    test('bookmark: the signed-in visitor saves the link, and the action leaves the address', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=bookmark&token=TOKEN&linkId=LINK#urlPassword')

      renderOptions({ user: USER })

      expect(addBookmark).toHaveBeenCalledTimes(1)
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)
    })

    test('make-copy: the signed-in visitor makes the copy, and the action leaves the address', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=make-copy&token=TOKEN&linkId=LINK#urlPassword')
      const onCreateCopy = vi.fn()

      renderOptions({ user: USER, onCreateCopy })

      expect(onCreateCopy).toHaveBeenCalledTimes(1)
      expect(addBookmark).not.toHaveBeenCalled()
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)
    })

    test('make-copy before the editor shows the document: the copy is made once Create a copy is there', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=make-copy&token=TOKEN&linkId=LINK#urlPassword')
      const { rerender } = renderOptions({ user: USER })
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)

      const onCreateCopy = vi.fn()
      rerender(optionsElement({ user: USER, onCreateCopy }))
      rerender(optionsElement({ user: USER, onCreateCopy }))

      expect(onCreateCopy).toHaveBeenCalledTimes(1)
    })

    test('make-copy with onResumeCopy: the copy is offered for a click, not made from the effect, which a popup blocker stops', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=make-copy&token=TOKEN&linkId=LINK#urlPassword')
      const onCreateCopy = vi.fn()
      const onResumeCopy = vi.fn()

      renderOptions({ user: USER, onCreateCopy, onResumeCopy })

      expect(onResumeCopy).toHaveBeenCalledTimes(1)
      expect(onCreateCopy).not.toHaveBeenCalled()
    })

    test('still anonymous: nothing is done, and the action leaves the address', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=bookmark&token=TOKEN&linkId=LINK#urlPassword')

      renderOptions({ user: undefined })

      expect(addBookmark).not.toHaveBeenCalled()
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)
    })

    test('once only: a remount after the action left the address does nothing', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=bookmark&token=TOKEN&linkId=LINK#urlPassword')
      const first = renderOptions({ user: USER })
      first.unmount()
      setLocation('https://docs.proton.dev/doc2?mode=open-url&token=TOKEN&linkId=LINK#urlPassword')

      renderOptions({ user: USER })

      expect(addBookmark).toHaveBeenCalledTimes(1)
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)
    })

    test('bookmark on a link to a folder: nothing is saved, as the button is hidden there, and the action leaves', () => {
      setLocation('https://docs.proton.dev/doc2?mode=open-url&action=bookmark&token=TOKEN&linkId=LINK#urlPassword')

      renderOptions({ user: USER, linkInfo: { ...DOCUMENT_LINK, isSharedUrlAFolder: true } })

      expect(addBookmark).not.toHaveBeenCalled()
      expect(mockRemoveActionFromUrl).toHaveBeenCalledTimes(1)
    })

    test('no action: nothing is done', () => {
      renderOptions({ user: USER })

      expect(addBookmark).not.toHaveBeenCalled()
      expect(mockRemoveActionFromUrl).not.toHaveBeenCalled()
    })
  })
})

/** Save for later, in the dropdown next to Create a copy, as on /doc */
async function saveForLaterButton() {
  if (!screen.queryByTestId('save-in-drive-button')) {
    await userEvent.click(screen.getByTestId('public-options-dropdown-button'))
  }
  return screen.getByTestId('save-in-drive-button')
}

function mockBookmarks({ isAlreadyBookmarked }: { isAlreadyBookmarked: boolean }) {
  vi.mocked(useDocsBookmarks).mockReturnValue({ addBookmark, isAlreadyBookmarked, isLoading: false })
}

function renderOptions(props: Partial<PublicHeaderOptionsProps> = {}) {
  return render(optionsElement(props))
}

function optionsElement(props: Partial<PublicHeaderOptionsProps>) {
  return (
    <PublicHeaderOptions
      participants={[]}
      editorInvoker={undefined}
      role={DEFAULT_ROLE}
      user={undefined}
      linkInfo={{ ...DOCUMENT_LINK, customPassword: 'custom' }}
      showSignupFlowModal={mockShowSignupFlowModal}
      {...props}
    />
  )
}
