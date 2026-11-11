import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CryptoProxy } from '@protontech/crypto'
import { SquashError, version } from '@proton-docs/realtime-sdk'
import type { DebugArtifacts, SquashErrorReason } from '@proton-docs/realtime-sdk'
import JSZip from 'jszip'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from '../__utils/createFakeSession'
import { UpdateRecorder } from '../__utils/UpdateRecorder'
import { DocumentDebugMenu, type DocumentDebugMenuProps } from './DocumentDebugMenu'

const mockDownloadFile = jest.fn()
jest.mock('@proton/shared/lib/helpers/downloadFile', () => ({
  __esModule: true,
  default: (blob: Blob, filename: string) => mockDownloadFile(blob, filename),
}))

const SESSION_CLIENT_ID = 1234
const EDITOR_CLIENT_ID = 5678
const BASE_COMMIT: DebugArtifacts['baseCommit'] = {
  commitId: 'commit-1',
  updates: [
    {
      uuid: 'u-1',
      encrypted: new Uint8Array([9]),
      decrypted: { content: new Uint8Array([1]), timestamp: 100, authorAddress: 'a@example.com' } as never,
    },
  ],
}

function renderMenu({ baseUpdateCount = 3 } = {}) {
  const fake = createFakeSession({ status: { name: 'connected' }, delivery: 'pending', baseCommitId: 'commit-1' })
  fake.mocks.getBaseState.mockReturnValue({
    commitId: 'commit-1',
    updates: Array.from({ length: baseUpdateCount }, () => BASE_COMMIT.updates[0].decrypted!),
  })
  const session = Object.assign(fake.session, {
    config: { clientId: SESSION_CLIENT_ID },
    squash: jest.fn(async () => {}),
    exportDebugArtifacts: jest.fn(() => ({ baseCommit: BASE_COMMIT, sentOrReceived: [], outbox: [] })),
  })
  const editorInvoker = {
    getClientId: jest.fn(async () => EDITOR_CLIENT_ID),
    getYDocAsJSON: jest.fn(async () => ({ root: ['ydoc'] })),
    getCurrentEditorState: jest.fn(async () => ({ root: { type: 'root' } }) as never),
    toggleDebugTreeView: jest.fn(async () => {}),
    receiveMessage: jest.fn(async () => {}),
  }
  const recorder = new UpdateRecorder({ commitId: 'commit-1', updates: [] }, () => 500)
  recorder.recordSent(new Uint8Array([4]))
  const props: DocumentDebugMenuProps = {
    session,
    snapshot: session.getSnapshot(),
    editorInvoker,
    recorder,
    sendUpdate: jest.fn(),
  }
  const application = {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  } as unknown as ApplicationProviderProps['application']
  render(<DocumentDebugMenu {...props} />, {
    wrapper: ({ children }) => <ApplicationProvider application={application}>{children}</ApplicationProvider>,
  })
  return { session, editorInvoker, props, logger: application.logger }
}

async function open() {
  await userEvent.click(screen.getByTestId('debug-menu-button'))
}

async function filesOf(zip: Blob) {
  const { files } = await JSZip.loadAsync(zip)
  return Object.keys(files)
}

beforeAll(async () => {
  const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts')
  CryptoApi.init({})
  CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore())
})

afterAll(() => CryptoProxy.releaseEndpoint())

describe('DocumentDebugMenu', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn(async () => {}) } })
  })
  afterEach(() => jest.clearAllMocks())

  test('opens from its button onto the diagnostics: both client ids, the base commit, status, delivery and SDK version', async () => {
    const { session } = renderMenu()
    expect(screen.queryByTestId('debug-menu')).not.toBeInTheDocument()

    await open()

    const diagnostics = screen.getByTestId('debug-diagnostics')
    await waitFor(() => expect(diagnostics).toHaveTextContent(`Editor client ID: ${EDITOR_CLIENT_ID}`))
    expect(diagnostics).toHaveTextContent(`Session client ID: ${SESSION_CLIENT_ID}`)
    expect(diagnostics).toHaveTextContent('Base commit: commit-1')
    expect(diagnostics).toHaveTextContent('Status: connected')
    expect(diagnostics).toHaveTextContent('Delivery: pending')
    expect(diagnostics).toHaveTextContent(`SDK version: ${version}`)
    expect(session.exportDebugArtifacts).not.toHaveBeenCalled()
  })

  test.each([
    ['Copy Y.Doc as JSON', JSON.stringify({ root: ['ydoc'] })],
    ['Copy Editor State as JSON', JSON.stringify({ root: { type: 'root' } })],
  ])('%s copies it to the clipboard', async (name, copied) => {
    renderMenu()
    await open()

    await userEvent.click(screen.getByRole('button', { name }))

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(copied))
  })

  test('Toggle Tree View toggles the editor tree view', async () => {
    const { editorInvoker } = renderMenu()
    await open()

    await userEvent.click(screen.getByRole('button', { name: 'Toggle Tree View' }))

    expect(editorInvoker.toggleDebugTreeView).toHaveBeenCalled()
  })

  test("Download Base Commit Updates exports the session's base commit only then, as /doc's zip", async () => {
    const { session } = renderMenu()
    await open()

    await userEvent.click(screen.getByRole('button', { name: /Download Base Commit Updates/ }))

    await waitFor(() =>
      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(Blob), 'all-updates-in-base-commit.zip'),
    )
    expect(session.exportDebugArtifacts).toHaveBeenCalledTimes(1)
    expect(await filesOf(mockDownloadFile.mock.lastCall[0])).toEqual(['100.bin'])
  })

  test('Download All Updates as ZIP downloads what the recorder holds', async () => {
    renderMenu()
    await open()

    await userEvent.click(screen.getByRole('button', { name: /Download All Updates as ZIP/ }))

    await waitFor(() => expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(Blob), 'all-updates.zip'))
    expect(await filesOf(mockDownloadFile.mock.lastCall[0])).toEqual([
      '500-a42c6cf1de3abfdea9b95f34687cbbe92b9a7383.bin',
    ])
  })

  test('Download Current State as ZIP downloads the logs', async () => {
    renderMenu()
    await open()

    await userEvent.click(screen.getByRole('button', { name: /Download Current State as ZIP/ }))

    await waitFor(() =>
      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/^document-logs-.*\.zip$/)),
    )
  })

  test('Squash now squashes, and says so once done', async () => {
    const { session } = renderMenu()
    let finishSquash = () => {}
    session.squash.mockReturnValue(new Promise<void>((resolve) => (finishSquash = resolve)))
    await open()

    await userEvent.click(screen.getByRole('button', { name: 'Squash now' }))

    expect(screen.getByRole('button', { name: 'Squash now' })).toBeDisabled()
    expect(screen.getByTestId('squash-result')).toHaveTextContent('Squashing…')
    await act(async () => finishSquash())
    expect(screen.getByTestId('squash-result')).toHaveTextContent('Squashed')
    expect(session.squash).toHaveBeenCalledTimes(1)
  })

  test.each([0, 1, 2])(
    'Squash now says there was nothing to squash when the base commit has %i updates, which the SDK leaves as they are',
    async (baseUpdateCount) => {
      const { session } = renderMenu({ baseUpdateCount })
      await open()

      await userEvent.click(screen.getByRole('button', { name: 'Squash now' }))

      await waitFor(() =>
        expect(screen.getByTestId('squash-result')).toHaveTextContent(
          `Nothing to squash: the base commit has ${baseUpdateCount} updates`,
        ),
      )
      expect(session.squash).toHaveBeenCalledTimes(1)
    },
  )

  test.each<SquashErrorReason>([
    'unreadableUpdatePresent',
    'alreadyInProgress',
    'lockUnavailable',
    'lockExpired',
    'commitNotFound',
    'requestFailed',
  ])('Squash now shows the SquashError reason %s', async (reason) => {
    const { session } = renderMenu()
    session.squash.mockRejectedValue(new SquashError(reason))
    await open()

    await userEvent.click(screen.getByRole('button', { name: 'Squash now' }))

    await waitFor(() => expect(screen.getByTestId('squash-result')).toHaveTextContent(`Squash failed: ${reason}`))
    expect(screen.getByRole('button', { name: 'Squash now' })).toBeEnabled()
  })

  test('Squash now says it failed, and logs why, for any other error', async () => {
    const { session, logger } = renderMenu()
    const error = new Error('No signMessage')
    session.squash.mockImplementation(() => {
      throw error
    })
    await open()

    await userEvent.click(screen.getByRole('button', { name: 'Squash now' }))

    await waitFor(() => expect(screen.getByTestId('squash-result')).toHaveTextContent('Squash failed'))
    expect(logger.error).toHaveBeenCalledWith('Debug menu squash failed', error)
  })

  test('the Update Replay Tool applies the updates of a downloaded zip to the editor, and persists them when asked', async () => {
    const { editorInvoker, props } = renderMenu()
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Open Update Replay Tool' }))
    const zip = new JSZip()
    zip.file('200-b.bin', new Uint8Array([2]))
    zip.file('100-a.bin', new Uint8Array([1]))
    const file = new File([await zip.generateAsync({ type: 'blob' })], 'all-updates.zip', { type: 'application/zip' })

    await userEvent.upload(await screen.findByTestId('replay-updates-input'), file)
    await screen.findByText('Applied: 0 / 2')
    await userEvent.click(screen.getByRole('button', { name: 'Apply next update' }))
    await screen.findByText('Applied: 1 / 2')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Persist applied updates' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply next update' }))
    await screen.findByText('Applied: 2 / 2')

    expect(editorInvoker.receiveMessage.mock.calls).toEqual([
      [{ type: { wrapper: 'du' }, content: new Uint8Array([1]) }],
      [{ type: { wrapper: 'du' }, content: new Uint8Array([2]) }],
    ])
    expect(props.sendUpdate).toHaveBeenCalledTimes(1)
    expect(props.sendUpdate).toHaveBeenCalledWith(new Uint8Array([2]))
    expect(screen.getByRole('button', { name: 'Apply next update' })).toBeDisabled()
  })

  test('the Update Replay Tool counts and persists only what it applied before a failure, and logs the failure', async () => {
    const { editorInvoker, props, logger } = renderMenu()
    const failure = new Error('Editor did not answer receiveMessage')
    editorInvoker.receiveMessage.mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure)
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Open Update Replay Tool' }))
    const zip = new JSZip()
    ;[1, 2, 3].forEach((byte) => zip.file(`${byte}00-x.bin`, new Uint8Array([byte])))
    const file = new File([await zip.generateAsync({ type: 'blob' })], 'all-updates.zip', { type: 'application/zip' })
    await userEvent.upload(await screen.findByTestId('replay-updates-input'), file)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Persist applied updates' }))
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } })

    await userEvent.click(screen.getByRole('button', { name: 'Apply 3 updates' }))

    await screen.findByText('Applied: 1 / 3')
    expect(props.sendUpdate).toHaveBeenCalledTimes(1)
    expect(props.sendUpdate).toHaveBeenCalledWith(new Uint8Array([1]))
    expect(logger.error).toHaveBeenCalledWith('Update Replay Tool failed to apply an update', failure)
    expect(screen.getByRole('button', { name: 'Apply next update' })).toBeEnabled()
  })
})
