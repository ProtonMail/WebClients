import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { type ProtonDrivePublicLinkClient, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { assignUrl } from '@proton/shared/lib/helpers/location'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { setLocation } from '@proton/vitest-config/setLocation'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import { createFakePublicSession } from './__utils/createFakeSession'
import type { DocumentHeaderV2Props } from './__components/DocumentHeaderV2'
import type { PublicLinkHandoff } from './__utils/publicLink'
import PublicDocumentPageV2 from './publicPage'

let mockPublicEditing = true
vi.mock('./__utils/flags', () => ({ usePublicEditingEnabled: () => mockPublicEditing }))
vi.mock('~/utils/flags', () => ({
  useIsSheetsEnabled: () => true,
  useIsDarkThemeEnabled: () => false,
}))
vi.mock('@proton/shared/lib/helpers/location')
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: vi.fn() }),
}))
// The app shell and its headers need the whole app around them
vi.mock('./__components/DocumentShell', () => ({
  DocumentShell: ({ header, children, loadingScreen }: Record<string, ReactNode>) => (
    <>
      {header}
      {children}
      {loadingScreen}
    </>
  ),
}))
vi.mock('./__components/ErrorHeader', () => ({ ErrorHeader: () => <div>Error header</div> }))
let mockHeaderProps: DocumentHeaderV2Props | undefined
vi.mock('./__components/DocumentHeaderV2', () => ({
  DocumentHeaderV2: (props: DocumentHeaderV2Props) => {
    mockHeaderProps = props
    return (
      <div>
        Document header for a {props.role}
        {props.status}
      </div>
    )
  },
}))
// The visitor's addresses come from the account store
const mockGetAddresses = vi.fn(async (): Promise<{ Email: string }[]> => [])
vi.mock('@proton/account/addresses/hooks', () => ({ useGetAddresses: () => mockGetAddresses }))
const mockCreateSession = vi.fn()
vi.mock('./__utils/usePublicRealtimeClient', () => ({
  usePublicRealtimeClient: () => ({ createSession: mockCreateSession }),
}))
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))

const ORIGIN = 'https://docs.proton.dev'
const PUBLIC_URL = '/doc2?mode=open-url&token=TOKEN&linkId=LINK'
const NODE_UID = generateNodeUid('VOLUME', 'LINK')

const getPublicNode = vi.fn()
const getOwnNode = vi.fn()
const logInfo = vi.fn()

describe('PublicDocumentPageV2', () => {
  beforeEach(() => {
    mockPublicEditing = true
    getPublicNode.mockResolvedValue({ uid: NODE_UID, name: 'Plans', mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE })
    vi.mocked(getDrive).mockReturnValue({ getNode: getOwnNode } as unknown as ReturnType<typeof getDrive>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test.each([
    { link: 'an editor link', permissions: SHARE_URL_PERMISSIONS.EDITOR, frame: 'editor-frame-edit' },
    { link: 'a viewer link', permissions: SHARE_URL_PERMISSIONS.VIEWER, frame: 'editor-frame-public-view' },
  ])('$link opens through the share link, with public editing on', async ({ permissions, frame }) => {
    start({ permissions })

    await waitFor(() => expect(mockCreateSession).toHaveBeenCalled())
    expect(getPublicNode).toHaveBeenCalledWith(NODE_UID)
    expect(mockCreateSession).toHaveBeenCalledWith({
      documentType: 'doc',
      nodeMeta: { token: 'TOKEN', linkId: 'LINK' },
    })
    expect(screen.getByTestId(frame)).toBeInTheDocument()
  })

  test("the page's log lines leave out the share token", async () => {
    start()

    await waitFor(() => expect(mockCreateSession).toHaveBeenCalled())
    expect(logInfo).toHaveBeenCalledWith('Resolved open action', { kind: 'openPublicLink' })
    expect(JSON.stringify(logInfo.mock.calls)).not.toContain('TOKEN')
  })

  // The Loader's tests show it never connects
  test('an editor link opens read-only in public view, with public editing off', async () => {
    mockPublicEditing = false
    start({ permissions: SHARE_URL_PERMISSIONS.EDITOR })

    expect(await screen.findByText('Document header for a Viewer')).toBeInTheDocument()
    expect(screen.getByTestId('editor-frame-public-view')).toBeInTheDocument()
  })

  test.each([
    { answer: 'the link', hasDirectAccess: true, ownNode: undefined },
    { answer: "the visitor's own Drive", hasDirectAccess: undefined, ownNode: Promise.resolve({}) },
  ])(
    'a visitor with access of their own, as $answer tells, goes to the private document on /doc2 under their local id',
    async ({ hasDirectAccess, ownNode }) => {
      getOwnNode.mockReturnValue(ownNode)
      start({ hasDirectAccess })

      await waitFor(() => expect(assignUrl).toHaveBeenCalled())
      expect(vi.mocked(assignUrl).mock.lastCall![0]).toBe(`${ORIGIN}/u/1/doc2?mode=open&volumeId=VOLUME&linkId=LINK`)
      expect(screen.getByRole('status')).toHaveTextContent('Redirecting…')
      expect(mockCreateSession).not.toHaveBeenCalled()
    },
  )

  test('a signed-in visitor whose own Drive refuses the node opens the public link', async () => {
    getOwnNode.mockRejectedValue(new Error('Item not found'))
    start({ hasDirectAccess: undefined })

    await waitFor(() => expect(mockCreateSession).toHaveBeenCalled())
    expect(getOwnNode).toHaveBeenCalledWith(NODE_UID)
    expect(assignUrl).not.toHaveBeenCalled()
  })

  describe("the title menu's Rename, for a signed-in visitor on a link to a folder", () => {
    const VISITOR = { Email: 'visitor@proton.me' } as UserModel

    beforeEach(() => {
      mockGetAddresses.mockResolvedValue([{ Email: 'other@proton.me' }, { Email: 'visitor@proton.me' }])
      getPublicNode.mockResolvedValue({
        uid: NODE_UID,
        name: 'Plans',
        mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
        keyAuthor: { ok: true, value: 'visitor@proton.me' },
        creationTime: new Date(),
      })
    })

    test('is allowed on a document they created, once their addresses load, with public editing on', async () => {
      start({ isSharedUrlAFolder: true, user: VISITOR })

      await screen.findByText('Document header for a Editor')
      await waitFor(() => expect(mockHeaderProps?.publicRename?.isAllowed()).toBe(true))
      expect(mockHeaderProps?.publicOptions).toBeTruthy()
    })

    test('is not for a viewer: an editor link with public editing off', async () => {
      mockPublicEditing = false
      start({ isSharedUrlAFolder: true, user: VISITOR })

      await screen.findByText('Document header for a Viewer')
      await waitFor(() => expect(mockGetAddresses).toHaveBeenCalled())
      expect(mockHeaderProps?.publicRename?.isAllowed()).toBe(false)
    })

    test('is not on a link to the document itself', async () => {
      start({ user: VISITOR })
      await screen.findByText('Document header for a Editor')
      await waitFor(() => expect(mockGetAddresses).toHaveBeenCalled())
      expect(mockHeaderProps?.publicRename?.isAllowed()).toBe(false)
    })

    test('is not for an anonymous visitor, whose addresses are never read', async () => {
      start({ isSharedUrlAFolder: true })

      await screen.findByText('Document header for a Editor')
      expect(mockGetAddresses).not.toHaveBeenCalled()
      expect(mockHeaderProps?.publicRename?.isAllowed()).toBe(false)
    })
  })

  function start(
    options: {
      permissions?: SHARE_URL_PERMISSIONS
      hasDirectAccess?: boolean | undefined
      isSharedUrlAFolder?: boolean
      user?: UserModel
    } = {},
  ) {
    const { permissions = SHARE_URL_PERMISSIONS.EDITOR, isSharedUrlAFolder = false, user } = options
    // Undefined when only the visitor's own Drive can tell
    const hasDirectAccess = 'hasDirectAccess' in options ? options.hasDirectAccess : false
    const fake = createFakePublicSession()
    mockCreateSession.mockReturnValue(fake.session)
    setLocation(`${ORIGIN}${PUBLIC_URL}#urlPassword`)
    const application = {
      logger: { info: logInfo, warn: vi.fn(), error: vi.fn() },
    } as unknown as ApplicationProviderProps['application']
    const handoff: PublicLinkHandoff = {
      publicDrive: {
        getNode: getPublicNode,
        experimental: { getSessionInfo: () => ({ uid: 'PUBLIC_UID' }) },
      } as unknown as ProtonDrivePublicLinkClient,
      linkInfo: { linkId: 'LINK', volumeId: 'VOLUME', permissions, isSharedUrlAFolder, hasDirectAccess },
      user,
      providerType: user ? 'public-authenticated' : 'public-unauthenticated',
    }

    render(
      <ConfigContext.Provider value={{ APP_VERSION: '0.0.0', API_URL: `${ORIGIN}/api` } as ProtonConfig}>
        <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
          <ApplicationProvider application={application}>
            <MemoryRouter initialEntries={[PUBLIC_URL]}>
              <CompatRouter>
                <DocsUrlContextProvider>
                  <PublicDocumentPageV2 {...handoff} />
                </DocsUrlContextProvider>
              </CompatRouter>
            </MemoryRouter>
          </ApplicationProvider>
        </AuthenticationContext.Provider>
      </ConfigContext.Provider>,
    )
    return fake
  }
})
