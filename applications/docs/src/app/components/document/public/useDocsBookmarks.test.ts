import { useApi } from '@proton/app-context/useApi'
import { useNotifications } from '@proton/app-context/useNotifications'
import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import { getDrive } from '@proton/drive/sdk'
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useDocsBookmarks } from './useDocsBookmarks'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))
jest.mock('@proton/app-context/useApi')
jest.mock('@proton/app-context/useNotifications')
jest.mock('@proton/docs-core/DriveSDK/traceErrorSDK')
jest.mock('@proton/shared/lib/helpers/metrics')

const api = jest.fn()
const createBookmark = jest.fn()
const createNotification = jest.fn()
const user = {} as UserModel

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item
  }
}

function mockBookmarks(bookmarks: unknown[]) {
  const iterateBookmarks = jest.fn(() => asyncIteratorFrom(bookmarks))
  jest.mocked(getDrive).mockReturnValue({ createBookmark, iterateBookmarks } as any)
  return iterateBookmarks
}

describe('useDocsBookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useApi).mockReturnValue(api as any)
    jest.mocked(useNotifications).mockReturnValue({ createNotification } as any)
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
    const iterateBookmarks = jest.fn()
    jest.mocked(getDrive).mockReturnValue({ iterateBookmarks } as any)

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
    const iterateBookmarks = jest.fn(async function* () {
      await pendingLoad
    })
    jest.mocked(getDrive).mockReturnValue({ iterateBookmarks } as any)

    const { unmount } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))
    expect(iterateBookmarks).toHaveBeenCalled()
    unmount()
    await act(async () => rejectLoad(new Error('aborted')))

    expect(traceErrorSDK).not.toHaveBeenCalled()
    expect(createNotification).not.toHaveBeenCalled()
  })

  it('treats degraded bookmark as already bookmarked', async () => {
    mockBookmarks([{ ok: false, error: { uid: 'token' } }])

    const { result } = renderHook(() => useDocsBookmarks({ token: 'token', urlPassword: 'pass', user }))

    await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true))
  })

  it('reports and notifies when loading bookmarks fails', async () => {
    const error = new Error('load failed')
    jest.mocked(getDrive).mockReturnValue({
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
