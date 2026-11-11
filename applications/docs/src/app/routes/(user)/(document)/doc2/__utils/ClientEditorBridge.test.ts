import { EditorBridgeMessageType } from '@proton/docs-shared/Bridge/EditorBridgeMessageType'
import type { SyncedEditorEvent } from '@proton/docs-shared/State/SyncedEditorState'
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings'

import { ClientEditorBridge } from './ClientEditorBridge'
import { EDITOR_CALL_TIMEOUT_MS, EDITOR_EXPORT_TIMEOUT_MS } from './EditorInvoker'
import { createClientHandler } from './createClientHandler'

const USER_SETTINGS = { Locale: 'fr_FR' } as UserSettings
const SCROLL_TO_USER_CURSOR: SyncedEditorEvent = {
  name: 'ScrollToUserCursorData',
  payload: {
    state: {
      name: 'alice',
      color: 'hsl(0, 0%, 0%)',
      focusing: true,
      anchorPos: null,
      focusPos: null,
      awarenessData: undefined,
    },
  },
}

const EDITOR_STATE = { root: { children: [], type: 'root' } }
const YDOC_JSON = { root: [] }

const logger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as ConstructorParameters<
  typeof ClientEditorBridge
>[2]

const sendUpdate = jest.fn()
const onWordCount = jest.fn()
const onEditorRendered = jest.fn()
const showModal = jest.fn()
const onFileMenuAction = jest.fn()
const onPresenceUpdate = jest.fn()
const fetchExternalImageAsBase64 = jest.fn()
const EXPORTED_DOCX = new Uint8Array([80, 75, 3, 4])

describe('ClientEditorBridge', () => {
  let frame: HTMLIFrameElement
  let postToEditor: jest.SpyInstance
  let bridge: ClientEditorBridge

  beforeEach(() => {
    frame = document.createElement('iframe')
    document.body.appendChild(frame)
    postToEditor = jest.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => {})
    const isFlagEnabled = (flag: string) => flag === 'DocsDarkTheme'
    bridge = new ClientEditorBridge(
      frame,
      createClientHandler({
        editorFrame: frame,
        sendUpdate,
        isFlagEnabled,
        onEditorError: jest.fn(),
        onWordCount,
        onEditorRendered,
        showModal,
        onFileMenuAction,
        onPresenceUpdate,
        fetchExternalImageAsBase64,
        logger,
      }),
      logger,
    )
  })

  afterEach(() => {
    bridge.destroy()
    frame.remove()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test("answers the editor's flag check", async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'checkIfFeatureFlagIsEnabled',
      args: ['DocsDarkTheme'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'message-1', returnValue: true },
      expect.any(String),
    )
  })

  test.each([
    { functionName: 'checkIfFeatureFlagIsEnabled', args: ['DocsEmojiPicker'], returnValue: false },
    { functionName: 'getAllThreads', args: [], returnValue: [] },
    { functionName: 'updateFrameSize', args: [480], returnValue: undefined },
    {
      functionName: 'reportWordCount',
      args: [{ document: { wordCount: 1, characterCount: 4 } }],
      returnValue: undefined,
    },
    { functionName: 'editorReportingTelemetry', args: ['table_of_contents_available'], returnValue: undefined },
  ])('answers the call a Viewer makes on its own to $functionName', async ({ functionName, args, returnValue }) => {
    receiveFromEditor({ type: EditorBridgeMessageType.EditorToClientInvokation, functionName, args, messageId: 'm-1' })

    await waitForReply()

    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'm-1', returnValue },
      expect.any(String),
    )
  })

  test('sizes the frame for printing to the height the editor reports, which says its editor is rendered', async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'updateFrameSize',
      args: [480],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(frame.style.getPropertyValue('--print-min-height')).toBe('480px')
    expect(onEditorRendered).toHaveBeenCalled()
  })

  test('passes the word count the editor reports on', async () => {
    const wordCount = { document: { wordCount: 2, characterCount: 9, nonWhitespaceCharacterCount: 8 } }
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'reportWordCount',
      args: [wordCount],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(onWordCount).toHaveBeenCalledWith(wordCount)
  })

  test("shows the editor's alert in a modal", async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'showGenericAlertModal',
      args: ['The export failed.'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(showModal).toHaveBeenCalledWith({ title: 'Something went wrong', translatedMessage: 'The export failed.' })
  })

  test("shows the editor's info in a modal", async () => {
    const info = { title: 'Table of contents', translatedMessage: 'Add headings to fill it.' }
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'showGenericInfoModal',
      args: [info],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(showModal).toHaveBeenCalledWith(info)
  })

  test('passes a file menu action from the editor on, and answers it', async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'handleFileMenuAction',
      args: [{ type: 'help' }],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(onFileMenuAction).toHaveBeenCalledWith({ type: 'help' })
    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'message-1', returnValue: undefined },
      expect.any(String),
    )
  })

  test("answers the editor's request for an external image with it through the image proxy", async () => {
    fetchExternalImageAsBase64.mockResolvedValue('data:image/png;base64,iVBORw0K')
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'fetchExternalImageAsBase64',
      args: ['https://example.com/cat.png'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(fetchExternalImageAsBase64).toHaveBeenCalledWith('https://example.com/cat.png')
    expect(postToEditor).toHaveBeenCalledWith(
      {
        type: EditorBridgeMessageType.ClientToEditorReply,
        messageId: 'message-1',
        returnValue: 'data:image/png;base64,iVBORw0K',
      },
      expect.any(String),
    )
  })

  test('sends an update the editor asks to propagate, and answers it', async () => {
    const content = new Uint8Array([1])
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'editorRequestsPropagationOfUpdate',
      args: [{ type: { wrapper: 'du' }, content }, 'DocState'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(sendUpdate).toHaveBeenCalledWith(content)
    expect(postToEditor).toHaveBeenCalledTimes(1)
    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'message-1', returnValue: undefined },
      expect.any(String),
    )
  })

  test("passes the editor's presence broadcast on as presence, not as an update, and answers it", async () => {
    const content = new Uint8Array([1])
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'editorRequestsPropagationOfUpdate',
      args: [{ type: { wrapper: 'events', eventType: 2 }, content }, 'DocState'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(onPresenceUpdate).toHaveBeenCalledWith(content)
    expect(sendUpdate).not.toHaveBeenCalled()
    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'message-1', returnValue: undefined },
      expect.any(String),
    )
  })

  test("drops the editor's request for other clients' presence, and answers it", async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'editorRequestsPropagationOfUpdate',
      args: [{ type: { wrapper: 'events', eventType: 10 }, content: new Uint8Array([1]) }, 'DocState'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(onPresenceUpdate).not.toHaveBeenCalled()
    expect(sendUpdate).not.toHaveBeenCalled()
    expect(postToEditor).toHaveBeenCalledWith(
      { type: EditorBridgeMessageType.ClientToEditorReply, messageId: 'message-1', returnValue: undefined },
      expect.any(String),
    )
  })

  test('ignores calls from any window but the editor frame', async () => {
    receiveFromEditor(
      {
        type: EditorBridgeMessageType.EditorToClientInvokation,
        functionName: 'checkIfFeatureFlagIsEnabled',
        args: ['DocsDarkTheme'],
        messageId: 'message-1',
      },
      window,
    )

    await waitForReply()

    expect(postToEditor).not.toHaveBeenCalled()
  })

  test('does not answer calls to methods the client handler does not define', async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'constructor',
      args: [],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(postToEditor).not.toHaveBeenCalled()
  })

  test("resolves an editor call with the editor's reply", async () => {
    const shown = bridge.editorInvoker.showEditor()
    const [{ messageId }] = postToEditor.mock.lastCall

    receiveFromEditor({ type: EditorBridgeMessageType.EditorToClientReply, messageId, returnValue: undefined })

    await expect(shown).resolves.toBeUndefined()
  })

  test.each<{
    functionName: string
    call: (invoker: ClientEditorBridge['editorInvoker']) => Promise<unknown>
    args: unknown[]
    returnValue?: unknown
  }>([
    {
      functionName: 'setTableOfContentsVisible',
      call: (invoker) => invoker.setTableOfContentsVisible(true),
      args: [true],
    },
    {
      functionName: 'loadUserSettings',
      call: (invoker) => invoker.loadUserSettings(USER_SETTINGS),
      args: [USER_SETTINGS],
    },
    { functionName: 'setDarkMode', call: (invoker) => invoker.setDarkMode(true), args: [true] },
    {
      functionName: 'syncProperty',
      call: (invoker) => invoker.syncProperty('suggestionsEnabled', false),
      args: ['suggestionsEnabled', false],
    },
    { functionName: 'getClientId', call: (invoker) => invoker.getClientId(), args: [], returnValue: 42 },
    { functionName: 'broadcastPresenceState', call: (invoker) => invoker.broadcastPresenceState(), args: [] },
    {
      functionName: 'syncEvent',
      call: (invoker) => invoker.syncEvent(SCROLL_TO_USER_CURSOR),
      args: [SCROLL_TO_USER_CURSOR],
    },
    {
      functionName: 'exportData',
      call: (invoker) => invoker.exportData('docx'),
      args: ['docx'],
      returnValue: EXPORTED_DOCX,
    },
    { functionName: 'printAsPDF', call: (invoker) => invoker.printAsPDF(), args: [] },
    {
      functionName: 'getCurrentSelection',
      call: (invoker) => invoker.getCurrentSelection('md'),
      args: ['md'],
      returnValue: '# Title',
    },
    {
      functionName: 'getCurrentEditorState',
      call: (invoker) => invoker.getCurrentEditorState(),
      args: [],
      returnValue: EDITOR_STATE,
    },
    { functionName: 'getYDocAsJSON', call: (invoker) => invoker.getYDocAsJSON(), args: [], returnValue: YDOC_JSON },
    { functionName: 'toggleDebugTreeView', call: (invoker) => invoker.toggleDebugTreeView(), args: [] },
  ])(
    "calls the editor's $functionName, and resolves with its reply",
    async ({ functionName, call, args, returnValue }) => {
      const called = call(bridge.editorInvoker)

      expect(postToEditor).toHaveBeenCalledWith(
        { type: EditorBridgeMessageType.ClientToEditorInvokation, functionName, args, messageId: expect.any(String) },
        expect.any(String),
      )
      const [{ messageId }] = postToEditor.mock.lastCall
      receiveFromEditor({ type: EditorBridgeMessageType.EditorToClientReply, messageId, returnValue })

      await expect(called).resolves.toBe(returnValue)
    },
  )

  test('rejects an editor call the editor does not answer in time', async () => {
    jest.useFakeTimers()
    const shown = bridge.editorInvoker.showEditor()

    jest.advanceTimersByTime(EDITOR_CALL_TIMEOUT_MS)

    await expect(shown).rejects.toThrow('Editor did not answer showEditor')
  })

  test.each([
    { functionName: 'exportData', call: () => bridge.editorInvoker.exportData('docx') },
    { functionName: 'getCurrentSelection', call: () => bridge.editorInvoker.getCurrentSelection('md') },
  ])('gives the editor longer to answer $functionName, which can fetch images', async ({ functionName, call }) => {
    jest.useFakeTimers()
    const exported = call()
    const settled = jest.fn()
    exported.then(settled, settled)

    await jest.advanceTimersByTimeAsync(EDITOR_CALL_TIMEOUT_MS)
    expect(settled).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(EDITOR_EXPORT_TIMEOUT_MS - EDITOR_CALL_TIMEOUT_MS)
    await expect(exported).rejects.toThrow(`Editor did not answer ${functionName}`)
  })

  test('never times out printAsPDF, which Firefox and Safari answer only once the print dialog closes', async () => {
    jest.useFakeTimers()
    const printed = bridge.editorInvoker.printAsPDF()
    const settled = jest.fn()
    printed.then(settled, settled)

    await jest.advanceTimersByTimeAsync(EDITOR_EXPORT_TIMEOUT_MS * 2)
    expect(settled).not.toHaveBeenCalled()

    const [{ messageId }] = postToEditor.mock.lastCall
    receiveFromEditor({ type: EditorBridgeMessageType.EditorToClientReply, messageId, returnValue: undefined })
    await expect(printed).resolves.toBeUndefined()
  })

  function receiveFromEditor(data: object, source: Window | null = frame.contentWindow) {
    window.dispatchEvent(new MessageEvent('message', { data, source }))
  }

  function waitForReply() {
    return new Promise((resolve) => setTimeout(resolve, 0))
  }
})
