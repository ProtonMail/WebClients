import { act, renderHook, waitFor } from '@testing-library/react'

import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import { MemberRole, getDrive } from '@proton/drive/sdk'

import { useDriveSharing } from './useDriveSharing'

jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))
jest.mock('@proton/docs-core/DriveSDK/traceErrorSDK', () => ({ traceErrorSDK: jest.fn() }))

const getNode = jest.fn()
const NODE_META = { volumeId: 'VOLUME', linkId: 'LINK' }

describe('useDriveSharing', () => {
  beforeEach(() => {
    jest.mocked(getDrive).mockReturnValue({ getNode } as unknown as ReturnType<typeof getDrive>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    [
      "the user's own",
      { membership: undefined, directRole: MemberRole.Admin },
      { isSharedDirectly: false, isSharedWithMe: false },
    ],
    [
      "a shared folder's",
      { membership: undefined, directRole: MemberRole.Inherited },
      { isSharedDirectly: false, isSharedWithMe: true },
    ],
    // Also when it sits in a shared folder: the membership on the document itself decides
    [
      'a directly shared',
      { membership: {}, directRole: MemberRole.Editor },
      { isSharedDirectly: true, isSharedWithMe: true },
    ],
  ])("tells %s document from Drive's node", async (_document, node, sharing) => {
    getNode.mockResolvedValue(node)

    const { result } = renderHook(() => useDriveSharing(NODE_META))

    expect(result.current.sharing).toBeUndefined()
    await waitFor(() => expect(result.current.sharing).toEqual(sharing))
    expect(result.current.failed).toBe(false)
    expect(getNode).toHaveBeenCalledWith('VOLUME~LINK')
  })

  test('stays unknown, reports and says it failed when Drive fails', async () => {
    const error = new Error('Offline')
    getNode.mockRejectedValue(error)

    const { result } = renderHook(() => useDriveSharing(NODE_META))

    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
    expect(result.current.sharing).toBeUndefined()
  })

  test('asks Drive again on retry, and answers once it does', async () => {
    getNode
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ membership: undefined, directRole: MemberRole.Admin })

    const { result } = renderHook(() => useDriveSharing(NODE_META))
    await waitFor(() => expect(result.current.failed).toBe(true))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.sharing).toEqual({ isSharedDirectly: false, isSharedWithMe: false }))
    expect(result.current.failed).toBe(false)
    expect(getNode).toHaveBeenCalledTimes(2)
  })

  test.each([
    ['a public link', { token: 'TOKEN', linkId: 'LINK' }],
    ['no document', undefined],
  ])('asks Drive nothing for %s', (_case, nodeMeta) => {
    const { result } = renderHook(() => useDriveSharing(nodeMeta))

    expect(result.current).toMatchObject({ sharing: undefined, failed: false })
    expect(getNode).not.toHaveBeenCalled()
  })
})
