import { render, screen } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import type { ReactNode } from 'react'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { HandshakeInfoVendorType } from '@proton/shared/lib/interfaces/drive/sharing'

import type { PublicLinkV2State, SignedInLink } from '../__utils/usePublicLinkV2'
import { PublicAppRootV2 } from './PublicAppRootV2'

/** `ProtonSheet` is not a member of the enum yet */
const ProtonSheet = 2 as HandshakeInfoVendorType

let mockRealtimeSdkEnabled = true
let mockFlagsStatus = { flagsReady: true, flagsError: null as unknown }
let mockLinkState: PublicLinkV2State
vi.mock('~/utils/flags', () => ({ useRealtimeSdkEnabled: () => mockRealtimeSdkEnabled }))
vi.mock('@unleash/proxy-client-react', async () => ({
  ...(await vi.importActual('@unleash/proxy-client-react')),
  useFlagsStatus: () => mockFlagsStatus,
}))
vi.mock('../__utils/usePublicLinkV2', () => ({
  usePublicLinkV2: () => ({ publicLinkState: mockLinkState, submitPublicLinkPassword: vi.fn() }),
  traceErrorSDK: vi.fn(),
}))
// The URL context needs the signed-in app around it
vi.mock('~/utils/docs-url-bar', async () => ({
  ...(await vi.importActual('~/utils/docs-url-bar')),
  DocsUrlContextProvider: ({ children }: { children: ReactNode }) => children,
  useDocsUrlBar: () => ({ openAction: null, removeLocalIDFromUrl: vi.fn() }),
}))
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: () => ({}),
  useDrive: () => ({ init: vi.fn() }),
}))
vi.mock('@proton/drive-store/lib/DriveStoreProvider', () => ({
  PublicDriveStoreProvider: ({ children }: { children: ReactNode }) => children,
  PublicDriveStoreProviderWithAuthenticatedUser: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@proton/account/user/hooks', () => ({ useGetUser: () => vi.fn() }))
vi.mock('@proton/components/hooks/useAuthentication', () => ({ default: () => ({ getLocalID: () => undefined }) }))
vi.mock('../../../../(public)/__components/PublicAppRootContainer', () => ({
  PublicAppRootContainer: () => <div>public app</div>,
}))
vi.mock('../publicPage', () => ({ default: () => <div>doc2 public page</div> }))
vi.mock('../__utils/useOpenDocumentHeartbeat', () => ({ useOpenDocumentHeartbeat: vi.fn() }))

const QUERY = '?mode=open-url&token=TOKEN&linkId=LINK'
const SIGNED_IN = { publicDrive: {}, linkInfo: { linkId: 'LINK' } } as unknown as SignedInLink
const READY: PublicLinkV2State = {
  isReady: true,
  isError: false,
  isPasswordNeeded: false,
  isWaitingForPasswordFromDriveWindow: false,
  vendorType: HandshakeInfoVendorType.ProtonDoc,
  signedIn: SIGNED_IN,
}

describe('PublicAppRootV2', () => {
  beforeEach(() => {
    mockRealtimeSdkEnabled = true
    mockFlagsStatus = { flagsReady: true, flagsError: null }
    mockLinkState = READY
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each(['/doc2', '/u/1/doc2'])(
    'renders doc2 public page on %s with DocsRealtimeSdkEnabled on',
    async (pathname) => {
      renderAt(pathname)

      expect(await screen.findByText('doc2 public page')).toBeInTheDocument()
      expect(window.location.pathname).toBe(pathname)
    },
  )

  test('hands over to the public app with DocsRealtimeSdkEnabled off, whose path check corrects /doc2 to /doc', () => {
    mockRealtimeSdkEnabled = false
    renderAt('/doc2')

    expect(screen.getByText('public app')).toBeInTheDocument()
  })

  test('waits until Unleash is ready, then picks the page', async () => {
    mockFlagsStatus = { flagsReady: false, flagsError: null }
    const { rerender } = renderAt('/doc2')

    expect(screen.getByText('Loading document...')).toBeInTheDocument()

    mockFlagsStatus = { flagsReady: true, flagsError: null }
    rerender()

    expect(await screen.findByText('doc2 public page')).toBeInTheDocument()
  })

  test('reads the flag as Unleash has it when Unleash fails', () => {
    mockRealtimeSdkEnabled = false
    mockFlagsStatus = { flagsReady: false, flagsError: new Error('Unleash is down') }
    renderAt('/doc2')

    expect(screen.getByText('public app')).toBeInTheDocument()
  })

  test('keeps the page it picked when the flag changes later', async () => {
    const { rerender } = renderAt('/doc2')
    mockRealtimeSdkEnabled = false
    rerender()

    expect(await screen.findByText('doc2 public page')).toBeInTheDocument()
  })

  test('waits for the sign-in, with the loader', () => {
    mockLinkState = { ...READY, isReady: false, signedIn: undefined }
    renderAt('/doc2')

    expect(screen.getByText('Loading document...')).toBeInTheDocument()
  })

  test('loads a spreadsheet in the public app on /sheet, before any password', () => {
    const replace = vi.spyOn(window.location, 'replace').mockImplementation(() => {})
    mockLinkState = { ...READY, isReady: false, isPasswordNeeded: true, vendorType: ProtonSheet, signedIn: undefined }
    renderAt('/u/1/doc2')

    expect(screen.getByText('Loading document...')).toBeInTheDocument()
    expect(replace).toHaveBeenCalledWith(`/u/1/sheet${QUERY}#urlPassword`)
  })
})

function renderAt(pathname: string) {
  window.history.replaceState(null, '', `${pathname}${QUERY}#urlPassword`)
  const history = createBrowserHistory()
  const app = () => (
    <Router history={history}>
      <CompatRouter>
        <PublicAppRootV2 hasReadySession={false} />
      </CompatRouter>
    </Router>
  )
  const result = render(app())
  return { rerender: () => result.rerender(app()) }
}
