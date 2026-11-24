import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { ApiContext } from '@proton/app-context/apiContext'
import { ConfigContext } from '@proton/app-context/configContext'
import { type ProtonDrivePublicLinkClient, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { cleanup, renderHook } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'

import { ApplicationProvider } from '~/utils/application-context'

import type { PublicLinkHandoff } from './publicLink'
import { usePublicRealtimeClient } from './usePublicRealtimeClient'

vi.mock('@proton/account/addresses/hooks')
vi.mock('@proton/account/addressKeys/hooks')
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))

const api = vi.fn()
const getPublicNode = vi.fn()
const getDocsKey = vi.fn()
const getSessionInfo = vi.fn()
const getMyFilesRootFolder = vi.fn()
const getAddresses = vi.fn()
const getAddressKeys = vi.fn()

const config = { API_URL: '/api', APP_NAME: 'proton-docs', APP_VERSION: '0.0.2.89' } as ProtonConfig
const application = { logger: { info: vi.fn(), warn: vi.fn() } } as unknown as ComponentProps<
  typeof ApplicationProvider
>['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ConfigContext.Provider value={config}>
    <ApiContext.Provider value={api}>
      <ApplicationProvider application={application}>{children}</ApplicationProvider>
    </ApiContext.Provider>
  </ConfigContext.Provider>
)

const nodeMeta = { token: 'TOKEN', linkId: 'link-1' }
const documentContentKey = { data: new Uint8Array(32), algorithm: 'aes256' }
const visitorPrivateKey = { getFingerprint: () => 'visitor-key' }

function render(providerType: PublicLinkHandoff['providerType']) {
  const publicDrive = {
    getNode: getPublicNode,
    experimental: { getDocsKey, getSessionInfo },
  } as unknown as ProtonDrivePublicLinkClient
  const linkInfo = {
    linkId: 'link-1',
    volumeId: 'volume-1',
    permissions: SHARE_URL_PERMISSIONS.EDITOR,
    isSharedUrlAFolder: false,
    hasDirectAccess: false,
  }
  return renderHook(() => usePublicRealtimeClient({ publicDrive, linkInfo, providerType }), { wrapper })
}

beforeEach(() => {
  vi.mocked(getDrive).mockReturnValue({ getMyFilesRootFolder } as unknown as ReturnType<typeof getDrive>)
  vi.mocked(useGetAddresses).mockReturnValue(getAddresses)
  vi.mocked(useGetAddressKeys).mockReturnValue(getAddressKeys)
  getSessionInfo.mockReturnValue({ uid: 'share-session-uid', accessToken: 'share-access-token' })
  getDocsKey.mockResolvedValue(documentContentKey)
  getMyFilesRootFolder.mockResolvedValue({ keyAuthor: { ok: true, value: 'Visitor@example.com' } })
  getAddresses.mockResolvedValue([
    { ID: 'other-address-id', Email: 'other@example.com', Status: ADDRESS_STATUS.STATUS_ENABLED },
    { ID: 'visitor-address-id', Email: 'visitor@example.com', Status: ADDRESS_STATUS.STATUS_ENABLED },
  ])
  getAddressKeys.mockResolvedValue([{ privateKey: visitorPrivateKey }])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('usePublicRealtimeClient', () => {
  test("is a public client on the share-URL session's uid", () => {
    const { result } = render('public-unauthenticated')

    expect(result.current.config.mode).toBe('public')
    expect(result.current.config.api).toEqual({
      baseUrl: '/api',
      appVersion: 'web-docs@0.0.2.89-dev',
      uid: 'share-session-uid',
      fetch: expect.any(Function),
    })
  })

  test("sends Docs API requests through the app API with the share-URL session's headers", async () => {
    api.mockResolvedValue(new Response('{}'))
    const { result } = render('public-unauthenticated')

    await result.current.config.api.fetch?.('/api/docs/urls/TOKEN/documents/link-1/meta', {
      method: 'GET',
      headers: { 'x-pm-appversion': 'web-docs@0.0.2.89-dev' },
    })

    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'docs/urls/TOKEN/documents/link-1/meta',
        headers: expect.objectContaining({
          'x-pm-appversion': 'web-docs@0.0.2.89-dev',
          'x-pm-uid': 'share-session-uid',
          Authorization: 'Bearer share-access-token',
        }),
      }),
    )
  })

  test("a signed-in visitor's own session sends only its uid", async () => {
    getSessionInfo.mockReturnValue({ uid: 'own-session-uid' })
    api.mockResolvedValue(new Response('{}'))
    const { result } = render('public-authenticated')

    await result.current.config.api.fetch?.('/api/docs/urls/TOKEN/documents/link-1/meta', { method: 'GET' })

    const { headers } = api.mock.lastCall![0]
    expect(headers).toEqual({ 'x-pm-uid': 'own-session-uid' })
  })

  test("reads the node through the share-URL client, in the link's volume", async () => {
    const node = { uid: generateNodeUid('volume-1', 'link-1') }
    getPublicNode.mockResolvedValue(node)
    const { result } = render('public-unauthenticated')

    await expect(result.current.config.bootstrap.getNode(nodeMeta)).resolves.toBe(node)
    expect(getPublicNode).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
  })

  test("an anonymous visitor's keys are the content key alone", async () => {
    const { result } = render('public-unauthenticated')

    await expect(result.current.config.bootstrap.getDocumentKeys(nodeMeta)).resolves.toEqual({ documentContentKey })
    expect(getDocsKey).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(getMyFilesRootFolder).not.toHaveBeenCalled()
  })

  test("a signed-in visitor's keys add their default share address, the My files root's key author, and its key", async () => {
    const { result } = render('public-authenticated')

    await expect(result.current.config.bootstrap.getDocumentKeys(nodeMeta)).resolves.toEqual({
      documentContentKey,
      userAddressPrivateKey: visitorPrivateKey,
      userOwnAddress: 'visitor@example.com',
    })
    expect(getAddressKeys).toHaveBeenCalledWith('visitor-address-id')
  })

  test("a signed-in visitor's keys fail when their default share address is disabled", async () => {
    getAddresses.mockResolvedValue([
      { ID: 'visitor-address-id', Email: 'visitor@example.com', Status: ADDRESS_STATUS.STATUS_DISABLED },
    ])
    const { result } = render('public-authenticated')

    await expect(result.current.config.bootstrap.getDocumentKeys(nodeMeta)).rejects.toThrow('Address is not available')
  })
})
