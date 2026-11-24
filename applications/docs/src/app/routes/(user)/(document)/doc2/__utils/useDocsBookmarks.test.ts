import { useApi } from '@proton/app-context/useApi'
import { useNotifications } from '@proton/app-context/useNotifications'
import { getDrive } from '@proton/drive/sdk'
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useDocsBookmarks } from './useDocsBookmarks'
import { traceErrorSDK } from './usePublicLinkV2'

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))
vi.mock('@proton/app-context/useApi')
vi.mock('@proton/app-context/useNotifications')
vi.mock('./usePublicLinkV2', () => ({ traceErrorSDK: vi.fn() }))
vi.mock('@proton/shared/lib/helpers/metrics')

const api = vi.fn()
const createBookmark = vi.fn()
const createNotification = vi.fn()
const user = {} as UserModel

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item
  }
}

function mockBookmarks(bookmarks: unknown[]) {
  const iterateBookmarks = vi.fn(() => asyncIteratorFrom(bookmarks))
  vi.mocked(getDrive).mockReturnValue({ createBookmark, iterateBookmarks } as any)
  return iterateBookmarks
}

describe('useDocsBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useApi).mockReturnValue(api as any)
    vi.mocked(useNotifications).mockReturnValue({ createNotification } as any)
    mockBookmarks([])
  })

  it('reports addToBookmark telemetry after bookmarking', async () => {
    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass' }))

    await act(() => result.current.addBookmark())

    expect(sendTelemetryReport).toHaveBeenCalledWith({
      api,
      measurementGroup: TelemetryMeasurementGroups.driveWebActions,
      event: TelemetryDriveWebFeature.actions,
      values: { count: 1 },
      dimensions: { name: 'addToBookmark' },
      delay: false,
    })
    expect(result.current.isAlreadyBookmarked).toBe(true)
  })

  it('passes custom password separately from url password', async () => {
    const { result } = renderHook(() =>
      useDocsBookmarks({ token: 'token', urlPassword: 'pass', customPassword: 'custom' }),
    )

    await act(() => result.current.addBookmark())

    const [url, customPassword] = createBookmark.mock.calls[0]
    expect(url).toMatch(/\/urls\/token#pass$/)
    expect(customPassword).toBe('custom')
  })

  it('marks document as bookmarked when its token is among loaded bookmarks', async () => {
    mockBookmarks([
      { ok: true, value: { uid: 'other' } },
      { ok: true, value: { uid: 'token' } },
    ])

    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true))
  })

  it('does not mark document as bookmarked when its token is not among loaded bookmarks', async () => {
    mockBookmarks([{ ok: true, value: { uid: 'other' } }])

    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await waitFor(() => expect(result.current.isLoading).toBe(true))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAlreadyBookmarked).toBe(false)
  })

  it('does not load bookmarks without user', () => {
    const iterateBookmarks = vi.fn()
    vi.mocked(getDrive).mockReturnValue({ iterateBookmarks } as any)

    renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass' }))

    expect(iterateBookmarks).not.toHaveBeenCalled()
  })

  it('loads bookmarks once user becomes available', async () => {
    const iterateBookmarks = mockBookmarks([])
    const { result, rerender } = renderHook(useDocsBookmarks, {
      initialProps: { token: 'token', urlPassword: 'pass' } as Parameters<typeof useDocsBookmarks>[0],
    })
    expect(iterateBookmarks).not.toHaveBeenCalled()

    rerender({ token: 'token', urlPassword: 'pass', user })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(iterateBookmarks).toHaveBeenCalledTimes(1)
  })

  it('keeps addBookmark stable until its inputs change', () => {
    const { result, rerender } = renderHook(useDocsBookmarks, {
      initialProps: { token: 'token', urlPassword: 'pass' },
    })
    const initialAddBookmark = result.current.addBookmark

    rerender({ token: 'token', urlPassword: 'pass' })
    expect(result.current.addBookmark).toBe(initialAddBookmark)

    rerender({ token: 'other', urlPassword: 'pass' })
    expect(result.current.addBookmark).not.toBe(initialAddBookmark)
  })

  it('does not report loading failure after unmount', async () => {
    let rejectLoad!: (error: Error) => void
    const pendingLoad = new Promise((_, reject) => {
      rejectLoad = reject
    })
    const iterateBookmarks = vi.fn(async function* () {
      await pendingLoad
    })
    vi.mocked(getDrive).mockReturnValue({ iterateBookmarks } as any)

    const { unmount } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))
    expect(iterateBookmarks).toHaveBeenCalled()
    unmount()
    await act(async () => rejectLoad(new Error('aborted')))

    expect(traceErrorSDK).not.toHaveBeenCalled()
    expect(createNotification).not.toHaveBeenCalled()
  })

  it('keeps a bookmark added while the list loads, as a Save for later resumed after sign-in is', async () => {
    let finishLoad!: () => void
    const loaded = new Promise<void>((resolve) => (finishLoad = resolve))
    vi.mocked(getDrive).mockReturnValue({
      createBookmark,
      iterateBookmarks: async function* () {
        await loaded
        yield { ok: true, value: { uid: 'other' } }
      },
    } as any)
    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await act(() => result.current.addBookmark())
    await act(async () => finishLoad())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAlreadyBookmarked).toBe(true)
  })

  it('treats degraded bookmark as already bookmarked', async () => {
    mockBookmarks([{ ok: false, error: { uid: 'token' } }])

    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true))
  })

  it('reports and notifies when loading bookmarks fails', async () => {
    const error = new Error('load failed')
    vi.mocked(getDrive).mockReturnValue({
      iterateBookmarks: async function* () {
        throw error
      },
    } as any)

    renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await waitFor(() => expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })))
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })

  it('reports and notifies when bookmarking fails, without marking document as bookmarked', async () => {
    const error = new Error('create failed')
    createBookmark.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass' }))

    await act(() => result.current.addBookmark())

    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    expect(result.current.isAlreadyBookmarked).toBe(false)
    expect(sendTelemetryReport).not.toHaveBeenCalled()
  })
})
