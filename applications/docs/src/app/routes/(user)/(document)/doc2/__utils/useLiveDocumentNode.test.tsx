import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { type DriveEvent, type NodeEntity, getDrive } from '@proton/drive/sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { useLiveDocumentNode } from './useLiveDocumentNode'

const mockInitialize = jest.fn()
const mockReset = jest.fn()
jest.mock('~/drive-sdk/event-subscriber', () => ({
  getEventSubscriber: () => ({ initialize: mockInitialize, reset: mockReset }),
}))
jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))

const getNode = jest.fn()
const NODE = { uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT', treeEventScopeId: 'SCOPE' } as NodeEntity
const MOVED_NODE = { ...NODE, parentUid: 'VOLUME~OTHER' } as NodeEntity

const application = {
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
} as unknown as ApplicationProviderProps['application']
const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

describe('useLiveDocumentNode', () => {
  // Not in afterEach: the testing library unmounts the previous test's hook after it, which resets the subscriber
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDrive).mockReturnValue({ getNode } as unknown as ReturnType<typeof getDrive>)
    mockInitialize.mockResolvedValue(undefined)
    getNode.mockResolvedValue(MOVED_NODE)
  })

  test('is the bootstrapped node, and listens to Drive events in its tree', () => {
    const { result } = renderHook(() => useLiveDocumentNode(NODE), { wrapper })

    expect(result.current).toBe(NODE)
    expect(mockInitialize).toHaveBeenCalledWith('SCOPE', [expect.any(Function)])
  })

  test('refreshes the node when Drive says it was updated', async () => {
    const { result } = renderHook(() => useLiveDocumentNode(NODE), { wrapper })

    await act(() => emit({ type: 'node_updated', nodeUid: 'VOLUME~LINK' }))

    expect(getNode).toHaveBeenCalledWith('VOLUME~LINK')
    await waitFor(() => expect(result.current).toBe(MOVED_NODE))
  })

  test.each([
    { type: 'node_updated', nodeUid: 'VOLUME~OTHER_DOCUMENT' },
    { type: 'node_created', nodeUid: 'VOLUME~LINK' },
  ])('ignores $type for $nodeUid', async (event) => {
    const { result } = renderHook(() => useLiveDocumentNode(NODE), { wrapper })

    await act(() => emit(event))

    expect(getNode).not.toHaveBeenCalled()
    expect(result.current).toBe(NODE)
  })

  test('stops listening when unmounted', async () => {
    let resolveNode: (node: NodeEntity) => void = () => {}
    getNode.mockReturnValue(new Promise((resolve) => (resolveNode = resolve)))
    const { result, unmount } = renderHook(() => useLiveDocumentNode(NODE), { wrapper })
    const refreshed = emit({ type: 'node_updated', nodeUid: 'VOLUME~LINK' })

    unmount()
    resolveNode(MOVED_NODE)
    await refreshed

    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(result.current).toBe(NODE)
  })

  test('is undefined, and listens to nothing, without a node', () => {
    const { result } = renderHook(() => useLiveDocumentNode(undefined), { wrapper })

    expect(result.current).toBeUndefined()
    expect(mockInitialize).not.toHaveBeenCalled()
  })
})

function emit(event: object) {
  const [, [listener]] = mockInitialize.mock.lastCall as [string, ((event: DriveEvent) => Promise<void>)[]]
  return listener(event as DriveEvent)
}
