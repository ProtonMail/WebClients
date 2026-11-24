import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { assignUrl } from '@proton/shared/lib/helpers/location'

import { duplicateWithState } from '../__utils/documentFileActions'
import { PublicDocumentCopier } from './PublicDocumentCopier'

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
vi.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger: mockLogger }) }))
const mockClient = { seedInitialCommit: vi.fn() }
vi.mock('../__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockClient }))
vi.mock('../__utils/documentFileActions', async () => ({
  ...(await vi.importActual('../__utils/documentFileActions')),
  duplicateWithState: vi.fn(),
}))
vi.mock('@proton/shared/lib/helpers/location')
// The error page's shell needs the whole app around it
vi.mock('./DocumentShell', () => ({ DocumentShell: ({ children }: { children: unknown }) => <>{children}</> }))
vi.mock('./ErrorHeader', () => ({ ErrorHeader: () => null }))

const DOCS_ORIGIN = 'http://docs.localhost'
const STATE = new Uint8Array([1, 2, 3])
const driveCompat = {} as DriveCompat

describe('PublicDocumentCopier', () => {
  let opener: { postMessage: ReturnType<typeof vi.fn> } | null

  beforeEach(() => {
    opener = { postMessage: vi.fn() }
    Object.defineProperty(window, 'opener', { configurable: true, get: () => opener })
    vi.mocked(duplicateWithState).mockResolvedValue({ volumeId: 'VOLUME', linkId: 'COPY' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('tells its opener it is ready, to the Docs origin only', () => {
    renderCopier()

    expect(opener!.postMessage).toHaveBeenCalledWith({ type: 'public-copier-ready' }, DOCS_ORIGIN)
    expect(screen.getByText('Making a copy...')).toBeInTheDocument()
  })

  test("copies the opener's document into My files, seeded with its state, and opens the copy in /doc2", async () => {
    renderCopier()

    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } })

    expect(duplicateWithState).toHaveBeenCalledWith(STATE, 'Plans', { driveCompat, client: mockClient })
    await waitFor(() =>
      expect(assignUrl).toHaveBeenCalledWith('http://docs.localhost/u/1/doc2?mode=open&volumeId=VOLUME&linkId=COPY'),
    )
  })

  test('ignores a message from another origin', async () => {
    renderCopier()

    await sendFrom('https://evil.example', { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } })

    expect(duplicateWithState).not.toHaveBeenCalled()
    expect(screen.getByText('Making a copy...')).toBeInTheDocument()
  })

  test('ignores a message from another window of the Docs origin', async () => {
    renderCopier()

    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } }, {})

    expect(duplicateWithState).not.toHaveBeenCalled()
  })

  test("a message without a document shows /doc's error rather than waiting for ever", async () => {
    renderCopier()

    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying' })

    expect(duplicateWithState).not.toHaveBeenCalled()
    expect(screen.getByTestId('invalid-openaction-error')).toBeInTheDocument()
  })

  test('copies once, whatever the opener sends again', async () => {
    renderCopier()

    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } })
    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } })

    expect(duplicateWithState).toHaveBeenCalledTimes(1)
  })

  test("a failed copy shows /doc's error", async () => {
    vi.mocked(duplicateWithState).mockRejectedValue(new Error('Seed failed'))
    renderCopier()

    await sendFrom(DOCS_ORIGIN, { type: 'data-for-copying', doc: { name: 'Plans', yjsData: STATE } })

    expect(await screen.findByTestId('invalid-openaction-error')).toHaveTextContent(
      'An error occurred while attempting to duplicate the document. Please try again.',
    )
    expect(assignUrl).not.toHaveBeenCalled()
  })

  test('a window opened without an opener shows the error, and copies nothing', () => {
    opener = null
    renderCopier()

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent(
      'An error occurred while attempting to duplicate the document. Please try again.',
    )
  })
})

async function sendFrom(origin: string, data: unknown, source: unknown = window.opener) {
  await act(async () => {
    window.dispatchEvent(new MessageEvent('message', { origin, data, source: source as Window }))
  })
}

function renderCopier() {
  return render(
    <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
      <MemoryRouter>
        <CompatRouter>
          <PublicDocumentCopier driveCompat={driveCompat} />
        </CompatRouter>
      </MemoryRouter>
    </AuthenticationContext.Provider>,
  )
}
