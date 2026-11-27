import { EditorEvent } from '@proton/docs-shared/Bridge/EditorEvent'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'

import { type ClientHandlerDependencies, createClientHandler } from './createClientHandler'
import { createFakeSession, fakeThread } from './createFakeSession'

describe('createClientHandler', () => {
  test("the editor's toolbar click reaches onToolbarClicked, which a public viewer's page opens the splash on", async () => {
    const onToolbarClicked = vi.fn()
    const handler = createClientHandler(dependencies({ onToolbarClicked }))

    await handler.editorReportingEvent(EditorEvent.ToolbarClicked, undefined)

    expect(onToolbarClicked).toHaveBeenCalledTimes(1)
  })

  test('without onToolbarClicked, a toolbar click does nothing', async () => {
    const handler = createClientHandler(dependencies({}))

    await expect(handler.editorReportingEvent(EditorEvent.ToolbarClicked, undefined)).resolves.toBeUndefined()
  })
})

describe('openLink', () => {
  /** The URLs `openLink` follows, by clicking a link in a new tab. */
  async function openedUrls(url: string) {
    const opened: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.target).toBe('_blank')
      expect(this.rel).toBe('noopener noreferrer')
      opened.push(this.href)
    })
    try {
      await createClientHandler(dependencies({})).openLink(url)
    } finally {
      click.mockRestore()
    }
    return opened
  }

  test.each([
    'https://example.com/a?b=c',
    'http://example.com/',
    'mailto:someone@example.com',
    'tel:+41000000000',
    'sms:+41000000000',
  ])('opens %s', async (url) => {
    expect(await openedUrls(url)).toEqual([url])
  })

  test.each([
    'javascript:alert(document.domain)',
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<h1>Sign in</h1>',
    'blob:https://example.com/id',
    'file:///etc/passwd',
    'smb://example.com/share',
    'ms-msdt:/id PCWDiagnostic',
    'search-ms:query=x',
    'about:blank',
    'example.com',
    '',
  ])("doesn't open %j", async (url) => {
    expect(await openedUrls(url)).toEqual([])
  })
})

describe('createClientHandler comment changes', () => {
  const lexical = (text: string) =>
    JSON.stringify({ root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] } })

  /** The session's comments, where each call to `verb` waits for the connection, as the SDK counts it, until `settle` */
  function waitingComments() {
    const fake = createFakeSession()
    const comments = fake.mocks.comments
    const onCommentChangeFailed = vi.fn()
    const handler = createClientHandler(dependencies({ comments: fake.session.comments, onCommentChangeFailed }))
    const settles: { resolve: () => void; reject: (error: unknown) => void }[] = []
    /** Makes the verb's next call wait, showing `change` at once as the SDK does */
    const waitNext = <T>(mock: { mockImplementationOnce: (run: () => Promise<T>) => unknown }, change = {}) =>
      mock.mockImplementationOnce(() => {
        const { promise, resolve, reject } = Promise.withResolvers<T>()
        settles.push({ resolve: () => resolve(undefined as T), reject })
        fake.setComments({ ...change, waitingChanges: comments.getSnapshot().waitingChanges + 1 })
        return promise
      })
    return { fake, comments, handler, onCommentChangeFailed, waitNext, settles }
  }

  test('a reply made while waiting answers at once with its placeholder, and a refusal after keeps its text', async () => {
    const { fake, comments, handler, onCommentChangeFailed, waitNext, settles } = waitingComments()
    fake.setComments({ threads: [fakeThread()] })
    const placeholder = { ...fakeThread().comments[0], id: 'placeholder-1', isPlaceholder: true }
    waitNext(comments.reply, { threads: [fakeThread({ comments: [...fakeThread().comments, placeholder] })] })

    const answer = await handler.createComment(lexical('See you there'), 'thread-1')

    expect(answer).toMatchObject({ id: 'placeholder-1', isPlaceholder: true })
    expect(onCommentChangeFailed).not.toHaveBeenCalled()

    settles[0].reject(new DocsApiError('addComment', 404))
    await vi.waitFor(() =>
      expect(onCommentChangeFailed).toHaveBeenCalledWith({
        call: 'createComment',
        threadDeleted: true,
        text: 'See you there',
      }),
    )
  })

  test('an edit made while waiting answers true at once; refused, it says what was written', async () => {
    const { comments, handler, onCommentChangeFailed, waitNext, settles } = waitingComments()
    waitNext(comments.editComment)

    expect(await handler.editComment('thread-1', 'comment-1', lexical('Edited'))).toBe(true)

    settles[0].reject(new DocsApiError('editComment', 500))
    await vi.waitFor(() =>
      expect(onCommentChangeFailed).toHaveBeenCalledWith({ call: 'editComment', threadDeleted: false, text: 'Edited' }),
    )
  })

  test('a thread made while waiting answers at once with the placeholder thread of its mark', async () => {
    const { comments, handler, onCommentChangeFailed, waitNext, settles } = waitingComments()
    waitNext(comments.createThread, {
      threads: [fakeThread({ id: 'placeholder-thread', markId: 'mark-9', isPlaceholder: true })],
    })

    const thread = await handler.createCommentThread(lexical('New'), 'mark-9', true)

    expect(thread).toMatchObject({ id: 'placeholder-thread', markID: 'mark-9', isPlaceholder: true })
    settles[0].resolve()
    await Promise.resolve()
    expect(onCommentChangeFailed).not.toHaveBeenCalled()
  })

  test('a waiting suggestion state answers true at once, and a refusal with NotExists says the thread was deleted', async () => {
    const { comments, handler, onCommentChangeFailed, waitNext, settles } = waitingComments()
    waitNext(comments.acceptSuggestion)

    expect(await handler.acceptSuggestion('thread-1', 'Summary')).toBe(true)
    expect(comments.acceptSuggestion).toHaveBeenCalledWith('thread-1', 'Summary')

    settles[0].reject(new DocsApiError('acceptSuggestion', 422, DocsApiErrorCode.NotExists))
    await vi.waitFor(() =>
      expect(onCommentChangeFailed).toHaveBeenCalledWith({ call: 'acceptSuggestion', threadDeleted: true }),
    )
  })

  test('a change that waits with no placeholder to answer with waits for the Docs API, and its refusal is told', async () => {
    const { comments, handler, onCommentChangeFailed, waitNext, settles } = waitingComments()
    // The reply's placeholder isn't in the snapshot, so the editor keeps its composer, and its text, until then
    waitNext(comments.reply)

    const answer = handler.createComment(lexical('Kept'), 'thread-1')
    settles[0].reject(new DocsApiError('addComment', 500))

    expect(await answer).toBeUndefined()
    expect(onCommentChangeFailed).toHaveBeenCalledWith({ call: 'createComment', threadDeleted: false })
  })

  test('a comment call failing while connected is only logged: the editor keeps the text and says so', async () => {
    const fake = createFakeSession()
    const onCommentChangeFailed = vi.fn()
    const handler = createClientHandler(dependencies({ comments: fake.session.comments, onCommentChangeFailed }))
    fake.mocks.comments.reply.mockRejectedValueOnce(new DocsApiError('addComment', 500))

    expect(await handler.createComment('Reply', 'thread-1')).toBeUndefined()
    expect(onCommentChangeFailed).not.toHaveBeenCalled()
  })

  test.each([
    [
      'createSuggestionThread',
      (handler: ReturnType<typeof createClientHandler>) => handler.createSuggestionThread('s-1', 'Summary', 'insert'),
      undefined,
    ],
    [
      'acceptSuggestion',
      (handler: ReturnType<typeof createClientHandler>) => handler.acceptSuggestion('thread-1', 'Summary'),
      false,
    ],
    [
      'rejectSuggestion',
      (handler: ReturnType<typeof createClientHandler>) => handler.rejectSuggestion('thread-1'),
      false,
    ],
    [
      'reopenSuggestion',
      (handler: ReturnType<typeof createClientHandler>) => handler.reopenSuggestion('thread-1'),
      false,
    ],
  ] as const)('%s failing while connected answers as failed and is told', async (call, run, failed) => {
    const fake = createFakeSession()
    const onCommentChangeFailed = vi.fn()
    const handler = createClientHandler(dependencies({ comments: fake.session.comments, onCommentChangeFailed }))
    fake.mocks.comments[call].mockRejectedValueOnce(new DocsApiError('createThread', 500))

    expect(await run(handler)).toBe(failed)
    expect(onCommentChangeFailed).toHaveBeenCalledWith({ call, threadDeleted: false })
  })
})

function dependencies(overrides: Partial<ClientHandlerDependencies>): ClientHandlerDependencies {
  return {
    editorFrame: {} as HTMLIFrameElement,
    sendUpdate: vi.fn(),
    isFlagEnabled: () => false,
    onEditorError: vi.fn(),
    onWordCount: vi.fn(),
    onEditorRendered: vi.fn(),
    showModal: vi.fn(),
    onFileMenuAction: vi.fn(),
    onPresenceUpdate: vi.fn(),
    fetchExternalImageAsBase64: async () => undefined,
    comments: undefined,
    onCommentChangeFailed: vi.fn(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as ClientHandlerDependencies['logger'],
    ...overrides,
  }
}
