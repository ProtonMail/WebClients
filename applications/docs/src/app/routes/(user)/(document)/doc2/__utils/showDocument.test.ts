import { sendBaseState, showDocument } from './showDocument'

const session = (updates: Uint8Array<ArrayBuffer>[]) => ({
  getNodeMeta: () => ({ volumeId: 'volume-1', linkId: 'link-1', userOwnAddress: 'member@example.com' }),
  getBaseState: () => ({
    commitId: 'commit-1',
    updates: updates.map((content) => ({
      content: content as Uint8Array<ArrayBuffer>,
      authorAddress: 'author@example.com',
      timestamp: 0,
      signature: new Uint8Array(),
      aad: '',
    })),
  }),
})

describe('sendBaseState', () => {
  test('sends each base state update to the editor as the base commit, in order', async () => {
    const first = new Uint8Array([1])
    const second = new Uint8Array([2])
    const editorInvoker = { receiveMessage: jest.fn(async () => {}) }

    await sendBaseState(editorInvoker, session([first, second]))

    expect(editorInvoker.receiveMessage.mock.calls).toEqual([
      [{ type: { wrapper: 'du' }, content: first, origin: 'BaseCommit' }],
      [{ type: { wrapper: 'du' }, content: second, origin: 'BaseCommit' }],
    ])
  })

  test('sends each base state update once the editor has answered the one before', async () => {
    let answerFirst: () => void = () => {}
    const editorInvoker = {
      receiveMessage: jest
        .fn()
        .mockReturnValueOnce(new Promise<void>((resolve) => (answerFirst = resolve)))
        .mockResolvedValue(undefined),
    }

    const sent = sendBaseState(editorInvoker, session([new Uint8Array([1]), new Uint8Array([2])]))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(editorInvoker.receiveMessage).toHaveBeenCalledTimes(1)

    answerFirst()
    await sent

    expect(editorInvoker.receiveMessage).toHaveBeenCalledTimes(2)
  })
})

describe('showDocument', () => {
  test('initializes the editor with the role, then shows it', async () => {
    const calls: unknown[][] = []
    const editorInvoker = {
      initializeEditor: jest.fn(async (...args: unknown[]) => {
        calls.push(['initializeEditor', ...args])
      }),
      showEditor: jest.fn(async () => {
        calls.push(['showEditor'])
      }),
    }

    await showDocument(editorInvoker, session([]), 'Editor', '0.0.2.89')

    expect(calls).toEqual([
      ['initializeEditor', expect.any(String), 'member@example.com', 'Editor', false, '0.0.2.89'],
      ['showEditor'],
    ])
  })

  test('does not show the editor when it fails to initialize', async () => {
    const editorInvoker = {
      initializeEditor: jest.fn().mockRejectedValue(new Error('Editor did not answer')),
      showEditor: jest.fn(),
    }

    await expect(showDocument(editorInvoker, session([]), 'Viewer', '0.0.2.89')).rejects.toThrow(
      'Editor did not answer',
    )
    expect(editorInvoker.showEditor).not.toHaveBeenCalled()
  })
})
