import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { ApiContext } from '@proton/app-context/apiContext'
import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { cleanup, renderHook } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'

import { ApplicationProvider } from '~/utils/application-context'

import { useRealtimeClient } from './useRealtimeClient'

jest.mock('@proton/account/addresses/hooks')
jest.mock('@proton/account/addressKeys/hooks')
jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const api = jest.fn()
const getNodeHierarchy = jest.fn()
const getDocsKey = jest.fn()
const getAddresses = jest.fn()
const getAddressKeys = jest.fn()

const config = { API_URL: '/api', APP_NAME: 'proton-docs', APP_VERSION: '0.0.2.89' } as ProtonConfig
const application = { logger: { info: jest.fn() } } as unknown as ComponentProps<
  typeof ApplicationProvider
>['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ConfigContext.Provider value={config}>
    <ApiContext.Provider value={api}>
      <AuthenticationContext.Provider value={{ UID: 'session-uid' } as any}>
        <ApplicationProvider application={application}>{children}</ApplicationProvider>
      </AuthenticationContext.Provider>
    </ApiContext.Provider>
  </ConfigContext.Provider>
)

const nodeMeta = { volumeId: 'volume-1', linkId: 'link-1' }
const memberPrivateKey = { getFingerprint: () => 'member-key' }

beforeEach(() => {
  jest.mocked(getDrive).mockReturnValue({
    getNodeHierarchy,
    experimental: { getDocsKey },
  } as unknown as ReturnType<typeof getDrive>)
  jest.mocked(useGetAddresses).mockReturnValue(getAddresses)
  jest.mocked(useGetAddressKeys).mockReturnValue(getAddressKeys)
  getNodeHierarchy.mockResolvedValue([
    { uid: generateNodeUid('volume-1', 'shared-folder'), deprecatedShareId: 'root-share-id' },
    { uid: generateNodeUid('volume-1', 'link-1') },
  ])
  api.mockResolvedValue({ AddressID: 'member-address-id' })
  getAddresses.mockResolvedValue([
    { ID: 'primary-address-id', Email: 'primary@example.com', Status: ADDRESS_STATUS.STATUS_ENABLED },
    { ID: 'member-address-id', Email: 'member@example.com', Status: ADDRESS_STATUS.STATUS_ENABLED },
  ])
  getAddressKeys.mockResolvedValue([{ privateKey: memberPrivateKey }])
})

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

describe('useRealtimeClient', () => {
  test('creates the client once per mount, not per render', () => {
    const { result, rerender } = renderHook(() => useRealtimeClient(), { wrapper })
    const client = result.current

    rerender()

    expect(result.current).toBe(client)
  })

  test('passes the same docs API and RTS values as the /doc page', () => {
    const { result } = renderHook(() => useRealtimeClient(), { wrapper })

    expect(result.current.config.api).toEqual({
      baseUrl: '/api',
      appVersion: 'web-docs@0.0.2.89-dev',
      uid: 'session-uid',
    })
    expect(result.current.config.rts).toMatchObject({
      appVersion: 'web-docs@0.0.2.89-dev',
      subProtocol: '0.0.2.89',
    })
  })

  test('getDocumentKeys signs with the member address of the given node, not the primary one', async () => {
    const documentContentKey = { data: new Uint8Array(32), algorithm: 'aes256' }
    getDocsKey.mockResolvedValue(documentContentKey)
    const { result } = renderHook(() => useRealtimeClient(), { wrapper })

    const documentKeys = await result.current.config.bootstrap.getDocumentKeys(nodeMeta)

    expect(getNodeHierarchy).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'drive/shares/root-share-id' }))
    expect(getAddressKeys).toHaveBeenCalledWith('member-address-id')
    expect(getDocsKey).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(documentKeys).toEqual({
      documentContentKey,
      userAddressPrivateKey: memberPrivateKey,
      userOwnAddress: 'member@example.com',
    })
  })

  test('getDocumentKeys fails when the member address is disabled', async () => {
    getAddresses.mockResolvedValue([
      { ID: 'member-address-id', Email: 'member@example.com', Status: ADDRESS_STATUS.STATUS_DISABLED },
    ])
    const { result } = renderHook(() => useRealtimeClient(), { wrapper })

    await expect(result.current.config.bootstrap.getDocumentKeys(nodeMeta)).rejects.toThrow('Address is not available')
  })
})
