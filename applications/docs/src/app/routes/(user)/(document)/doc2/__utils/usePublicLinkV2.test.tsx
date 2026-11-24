import { renderHook, waitFor } from '@testing-library/react'

import { MemberRole, NodeType, generateNodeUid } from '@proton/drive/sdk'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { HandshakeInfoVendorType } from '@proton/shared/lib/interfaces/drive/sharing'

import { receiveCustomPasswordFromDriveWindow } from '@proton/drive/public/publicDocsSharing'

import { usePublicLinkV2 } from './usePublicLinkV2'

const getURLAccessInfo = vi.fn()
const authURLAccess = vi.fn()
const getRootNode = vi.fn()
const publicDrive = { getRootNode, experimental: { getSessionInfo: () => ({ uid: 'PUBLIC_UID' }) } }
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: () => ({ experimental: { getURLAccessInfo, authURLAccess } }),
}))
vi.mock('@proton/metrics/metricsInstance', () => ({ default: { setAuthHeaders: vi.fn() } }))
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }))
vi.mock('@proton/drive/public/publicDocsSharing', () => ({ receiveCustomPasswordFromDriveWindow: vi.fn() }))

describe('usePublicLinkV2', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/doc2?mode=open-url&token=TOKEN&linkId=URL_LINK#urlPassword')
    getURLAccessInfo.mockResolvedValue({
      isCustomPasswordProtected: false,
      directAccess: undefined,
      vendorType: HandshakeInfoVendorType.ProtonDoc,
    })
    authURLAccess.mockResolvedValue(publicDrive)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test("a link to a document hands over the client and the root's link, without docs-core", async () => {
    getRootNode.mockResolvedValue({
      uid: generateNodeUid('VOLUME', 'ROOT'),
      type: NodeType.File,
      directRole: MemberRole.Editor,
    })
    const { result } = renderHook(() => usePublicLinkV2('public-unauthenticated'))

    await waitFor(() => expect(result.current.publicLinkState.isReady).toBe(true))
    expect(result.current.publicLinkState.vendorType).toBe(HandshakeInfoVendorType.ProtonDoc)
    expect(result.current.publicLinkState.signedIn).toEqual({
      publicDrive,
      linkInfo: {
        linkId: 'ROOT',
        volumeId: 'VOLUME',
        isSharedUrlAFolder: false,
        permissions: SHARE_URL_PERMISSIONS.EDITOR,
        hasDirectAccess: false,
      },
    })
  })

  test("a link to a folder opens the URL's link, and only Drive can tell a signed-in visitor's access", async () => {
    getRootNode.mockResolvedValue({
      uid: generateNodeUid('VOLUME', 'FOLDER'),
      type: NodeType.Folder,
      directRole: MemberRole.Viewer,
    })
    const { result } = renderHook(() => usePublicLinkV2('public-authenticated'))

    await waitFor(() => expect(result.current.publicLinkState.isReady).toBe(true))
    expect(result.current.publicLinkState.signedIn?.linkInfo).toEqual({
      linkId: 'URL_LINK',
      volumeId: 'VOLUME',
      isSharedUrlAFolder: true,
      permissions: SHARE_URL_PERMISSIONS.VIEWER,
      hasDirectAccess: undefined,
    })
  })

  test('a password-protected link waits for its password', async () => {
    getURLAccessInfo.mockResolvedValue({
      isCustomPasswordProtected: true,
      vendorType: HandshakeInfoVendorType.ProtonDoc,
    })
    const { result } = renderHook(() => usePublicLinkV2('public-unauthenticated'))

    await waitFor(() => expect(result.current.publicLinkState.isPasswordNeeded).toBe(true))
    expect(result.current.publicLinkState.isReady).toBe(false)
    expect(authURLAccess).not.toHaveBeenCalled()
  })

  test("a spreadsheet's link neither signs in nor waits for a password, as the public app on /sheet does both", async () => {
    getURLAccessInfo.mockResolvedValue({ isCustomPasswordProtected: true, vendorType: 2 as HandshakeInfoVendorType })
    const { result } = renderHook(() => usePublicLinkV2('public-unauthenticated'))

    await waitFor(() => expect(result.current.publicLinkState.vendorType).toBe(2))
    expect(result.current.publicLinkState.isPasswordNeeded).toBe(false)
    expect(receiveCustomPasswordFromDriveWindow).not.toHaveBeenCalled()
    expect(authURLAccess).not.toHaveBeenCalled()
  })
})
