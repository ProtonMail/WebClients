import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'

import { usePublicDocumentCopying } from './publicDocumentCopying'

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
vi.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger: mockLogger }) }))
const mockCreateNotification = vi.fn()
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))

const DOCS_ORIGIN = 'http://docs.localhost'
const STATE = new Uint8Array([1, 2, 3])

describe('usePublicDocumentCopying', () => {
  let copier: { postMessage: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }
  let open: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    copier = { postMessage: vi.fn(), close: vi.fn() }
    open = vi.spyOn(window, 'open').mockReturnValue(copier as unknown as Window)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('opens /doc2?mode=copy-public under the local id, and answers its ready message with the name and state', async () => {
    const getState = vi.fn(async () => STATE)
    const createCopy = renderCopying({ getState })

    createCopy()
    expect(open).toHaveBeenCalledWith('http://docs.localhost/u/1/doc2?mode=copy-public', '_blank')
    expect(getState).not.toHaveBeenCalled()

    await sendFrom(copier, DOCS_ORIGIN, { type: 'public-copier-ready' })

    expect(copier.postMessage).toHaveBeenCalledWith(
      { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } },
      DOCS_ORIGIN,
    )
  })

  test('answers once, and only the window it opened, from the Docs origin', async () => {
    const createCopy = renderCopying({})
    createCopy()

    await sendFrom(copier, 'https://evil.example', { type: 'public-copier-ready' })
    await sendFrom({}, DOCS_ORIGIN, { type: 'public-copier-ready' })
    expect(copier.postMessage).not.toHaveBeenCalled()

    await sendFrom(copier, DOCS_ORIGIN, { type: 'public-copier-ready' })
    await sendFrom(copier, DOCS_ORIGIN, { type: 'public-copier-ready' })
    expect(copier.postMessage).toHaveBeenCalledTimes(1)
  })

  test("closes the copy window when the editor's state can't be read, which would wait for ever", async () => {
    const createCopy = renderCopying({
      getState: async () => {
        throw new Error('No editor')
      },
    })
    createCopy()

    await sendFrom(copier, DOCS_ORIGIN, { type: 'public-copier-ready' })

    expect(copier.postMessage).not.toHaveBeenCalled()
    expect(copier.close).toHaveBeenCalledTimes(1)
  })

  test('a blocked popup leaves the page as it is, and says the copy failed', () => {
    open.mockReturnValue(null)
    const createCopy = renderCopying({})

    createCopy()

    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })
})

function renderCopying({ getState = async () => STATE }: { getState?: () => Promise<Uint8Array<ArrayBuffer>> }) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>{children}</AuthenticationContext.Provider>
  )
  const { result } = renderHook(() => usePublicDocumentCopying({ getName: () => 'Plans', getState }), { wrapper })
  return result.current
}

async function sendFrom(source: unknown, origin: string, data: unknown) {
  await act(async () => {
    window.dispatchEvent(new MessageEvent('message', { source: source as Window, origin, data }))
  })
}
