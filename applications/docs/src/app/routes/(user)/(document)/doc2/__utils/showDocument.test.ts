import { showDocument } from './showDocument'

describe('showDocument', () => {
  test('initializes the editor with the role, applies each base state update as the base commit, then shows it', async () => {
    const calls: unknown[][] = []
    const editorInvoker = {
      initializeEditor: jest.fn(async (...args: unknown[]) => {
        calls.push(['initializeEditor', ...args])
      }),
      receiveMessage: jest.fn(async (message: unknown) => {
        calls.push(['receiveMessage', message])
      }),
      showEditor: jest.fn(async () => {
        calls.push(['showEditor'])
      }),
    }
    const first = new Uint8Array([1])
    const second = new Uint8Array([2])
    const session = {
      getNodeMeta: () => ({ volumeId: 'volume-1', linkId: 'link-1', userOwnAddress: 'member@example.com' }),
      getBaseState: () => ({
        commitId: 'commit-1',
        updates: [first, second].map((content) => ({
          content,
          authorAddress: 'author@example.com',
          timestamp: 0,
          signature: new Uint8Array(),
          aad: '',
        })),
      }),
    }

    await showDocument(editorInvoker, session, 'Editor', '0.0.2.89')

    expect(calls).toEqual([
      ['initializeEditor', expect.any(String), 'member@example.com', 'Editor', false, '0.0.2.89'],
      ['receiveMessage', { type: { wrapper: 'du' }, content: first, origin: 'BaseCommit' }],
      ['receiveMessage', { type: { wrapper: 'du' }, content: second, origin: 'BaseCommit' }],
      ['showEditor'],
    ])
  })

  test('sends each base state update once the editor has answered the one before', async () => {
    let answerFirst: () => void = () => {}
    const editorInvoker = {
      initializeEditor: jest.fn(async () => {}),
      receiveMessage: jest
        .fn()
        .mockReturnValueOnce(new Promise<void>((resolve) => (answerFirst = resolve)))
        .mockResolvedValue(undefined),
      showEditor: jest.fn(async () => {}),
    }
    const session = {
      getNodeMeta: () => ({ volumeId: 'volume-1', linkId: 'link-1', userOwnAddress: 'member@example.com' }),
      getBaseState: () => ({
        commitId: 'commit-1',
        updates: [new Uint8Array([1]), new Uint8Array([2])].map((content) => ({
          content,
          authorAddress: 'author@example.com',
          timestamp: 0,
          signature: new Uint8Array(),
          aad: '',
        })),
      }),
    }

    const shown = showDocument(editorInvoker, session, 'Viewer', '0.0.2.89')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(editorInvoker.receiveMessage).toHaveBeenCalledTimes(1)

    answerFirst()
    await shown

    expect(editorInvoker.receiveMessage).toHaveBeenCalledTimes(2)
    expect(editorInvoker.showEditor).toHaveBeenCalledTimes(1)
  })

  test('does not show the editor when it fails to initialize', async () => {
    const editorInvoker = {
      initializeEditor: jest.fn().mockRejectedValue(new Error('Editor did not answer')),
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
    }
    const session = {
      getNodeMeta: () => ({ volumeId: 'volume-1', linkId: 'link-1', userOwnAddress: 'member@example.com' }),
      getBaseState: () => ({ commitId: undefined, updates: [] }),
    }

    await expect(showDocument(editorInvoker, session, 'Viewer', '0.0.2.89')).rejects.toThrow('Editor did not answer')
    expect(editorInvoker.showEditor).not.toHaveBeenCalled()
  })
})
