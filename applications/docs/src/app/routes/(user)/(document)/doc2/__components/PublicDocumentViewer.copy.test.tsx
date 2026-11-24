import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { RedirectAction } from '@proton/docs-shared/DocumentAction'
import type { ProtonDrivePublicLinkClient } from '@proton/drive/sdk'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { setLocation } from '@proton/vitest-config/setLocation'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'

import type { LoaderDeps, LoaderStatus } from '../__utils/loadDocument'
import type { PublicLinkHandoff } from '../__utils/publicLink'
import type { DocumentHeaderV2Props } from './DocumentHeaderV2'
import type { PublicHeaderOptionsProps } from './PublicHeaderOptions'
import { PublicDocumentViewer } from './PublicDocumentViewer'

// The viewer's Create a copy wiring, with the Loader at the status each test gives

let mockStatus: LoaderStatus
let mockLoaderDeps: LoaderDeps | undefined
vi.mock('../__utils/useDocumentLoader', () => ({
  useDocumentLoader: (deps: LoaderDeps) => {
    mockLoaderDeps = deps
    return { status: mockStatus, onFrameReady: vi.fn() }
  },
}))
const mockCreateCopy = vi.fn()
vi.mock('../__utils/publicDocumentCopying', async () => ({
  ...(await vi.importActual('../__utils/publicDocumentCopying')),
  usePublicDocumentCopying: () => mockCreateCopy,
}))
const mockShowSignupFlowModal = vi.fn()
vi.mock('./SignupFlowModal', () => ({ useSignupFlowModal: () => [null, mockShowSignupFlowModal] }))
let mockHeaderProps: DocumentHeaderV2Props | undefined
vi.mock('./DocumentHeaderV2', () => ({
  DocumentHeaderV2: (props: DocumentHeaderV2Props) => {
    mockHeaderProps = props
    return null
  },
}))
vi.mock('./DocumentShell', () => ({
  DocumentShell: ({ header, children }: Record<string, ReactNode>) => (
    <>
      {header}
      {children}
    </>
  ),
}))
vi.mock('~/components/document/EditorFrame', () => ({ EditorFrame: () => null }))
vi.mock('../__utils/usePublicRealtimeClient', () => ({ usePublicRealtimeClient: () => ({}) }))
const mockGetAddresses = async () => []
vi.mock('@proton/account/addresses/hooks', () => ({ useGetAddresses: () => mockGetAddresses }))
vi.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => () => false }))
vi.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => false }))
const mockCreateNotification = vi.fn((_options: { text: ReactNode }) => 1)
const mockRemoveNotification = vi.fn()
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification, removeNotification: mockRemoveNotification }),
}))

const NODE = { uid: 'VOLUME~LINK', name: { ok: true, value: 'Plans' } }

describe('PublicDocumentViewer, Create a copy', () => {
  beforeEach(() => {
    setLocation('https://docs.proton.dev/doc2?mode=open-url&token=TOKEN&linkId=LINK#urlPassword')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('is offered only once the editor shows the document, whose state it copies', () => {
    mockStatus = { name: 'loading', step: 'catchUp', node: NODE, role: 'Viewer' } as unknown as LoaderStatus
    const user = {} as UserModel
    const { rerender } = renderViewer({ user })
    expect(publicOptions().onCreateCopy).toBeUndefined()

    mockStatus = revealed()
    rerender(viewerElement({ user }))
    publicOptions().onCreateCopy!()

    expect(mockCreateCopy).toHaveBeenCalledTimes(1)
  })

  test("a signed-in viewer's toolbar click opens the splash, whose Create a copy makes the copy", async () => {
    mockStatus = revealed()
    renderViewer({ user: {} as UserModel })

    await act(async () => mockLoaderDeps!.bridgeHandlers.onToolbarClicked!())
    await userEvent.click(await screen.findByRole('button', { name: 'Create a copy' }))

    expect(mockCreateCopy).toHaveBeenCalledTimes(1)
    expect(mockShowSignupFlowModal).not.toHaveBeenCalled()
  })

  test("an anonymous viewer's splash asks them to sign up first, coming back to make the copy", async () => {
    mockStatus = revealed()
    renderViewer()

    await act(async () => mockLoaderDeps!.bridgeHandlers.onToolbarClicked!())
    await userEvent.click(await screen.findByRole('button', { name: 'Create a copy' }))

    expect(mockShowSignupFlowModal).toHaveBeenCalledWith({
      urlPassword: 'urlPassword',
      redirectAction: RedirectAction.MakeCopy,
      openInNewTab: true,
    })
    expect(mockCreateCopy).not.toHaveBeenCalled()
  })

  test("the header's Create a copy sends an anonymous visitor to sign up first, in the page's one sign-up modal", async () => {
    mockStatus = revealed()
    renderViewer()

    await act(async () => publicOptions().onCreateCopy!())

    expect(publicOptions().showSignupFlowModal).toBe(mockShowSignupFlowModal)
    expect(mockShowSignupFlowModal).toHaveBeenCalledWith({
      urlPassword: 'urlPassword',
      redirectAction: RedirectAction.MakeCopy,
      openInNewTab: true,
    })
    expect(mockCreateCopy).not.toHaveBeenCalled()
  })

  test('the copy asked for before signing in is offered in the splash, for a click to make it', async () => {
    mockStatus = revealed()
    renderViewer({ user: {} as UserModel })

    await act(async () => publicOptions().onResumeCopy!())

    expect(await screen.findByText('Create a copy to edit')).toBeInTheDocument()
    expect(mockCreateCopy).not.toHaveBeenCalled()
  })
})

test("an editor's copy asked for before signing in is offered in a notification, as the splash is a viewer's", async () => {
  mockStatus = revealed('Editor')
  render(viewerElement({ user: {} as UserModel, permissions: SHARE_URL_PERMISSIONS.EDITOR }))

  await act(async () => publicOptions().onResumeCopy!())

  expect(screen.queryByText('Create a copy to edit')).not.toBeInTheDocument()
  const [[{ text }]] = mockCreateNotification.mock.calls
  render(<>{text}</>)
  await userEvent.click(screen.getByRole('button', { name: 'Create a copy' }))
  expect(mockCreateCopy).toHaveBeenCalledTimes(1)
  expect(mockRemoveNotification).toHaveBeenCalledWith(1)
})

function revealed(role: 'Viewer' | 'Editor' = 'Viewer'): LoaderStatus {
  return {
    name: 'revealed',
    node: NODE,
    role,
    // Every invoker call answers, as the editor's do
    editorInvoker: new Proxy({} as Record<string | symbol, unknown>, {
      get: (calls, method) => (calls[method] ??= vi.fn(async () => undefined)),
    }),
  } as unknown as LoaderStatus
}

function publicOptions(): PublicHeaderOptionsProps {
  return (mockHeaderProps!.publicOptions as ReactElement<PublicHeaderOptionsProps>).props
}

function renderViewer(options: { user?: UserModel } = {}) {
  return render(viewerElement(options))
}

function viewerElement({
  user,
  permissions = SHARE_URL_PERMISSIONS.VIEWER,
}: { user?: UserModel; permissions?: SHARE_URL_PERMISSIONS } = {}) {
  const application = {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  } as unknown as ApplicationProviderProps['application']
  const handoff: PublicLinkHandoff = {
    publicDrive: {} as ProtonDrivePublicLinkClient,
    linkInfo: {
      linkId: 'LINK',
      volumeId: 'VOLUME',
      permissions,
      isSharedUrlAFolder: false,
      hasDirectAccess: false,
    },
    user,
    providerType: user ? 'public-authenticated' : 'public-unauthenticated',
  }
  return (
    <ConfigContext.Provider value={{ APP_VERSION: '0.0.0' } as ProtonConfig}>
      <AuthenticationContext.Provider value={{ getLocalID: () => undefined } as any}>
        <ApplicationProvider application={application}>
          <MemoryRouter>
            <CompatRouter>
              <DebugModeProvider>
                <PublicDocumentViewer token="TOKEN" handoff={handoff} publicEditing onRetry={vi.fn()} />
              </DebugModeProvider>
            </CompatRouter>
          </MemoryRouter>
        </ApplicationProvider>
      </AuthenticationContext.Provider>
    </ConfigContext.Provider>
  )
}
