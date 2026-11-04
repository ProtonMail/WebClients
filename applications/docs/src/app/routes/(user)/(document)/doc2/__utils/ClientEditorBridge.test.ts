import { EditorBridgeMessageType } from '@proton/docs-shared/Bridge/EditorBridgeMessageType'

import { ClientEditorBridge } from './ClientEditorBridge'
import { EDITOR_CALL_TIMEOUT_MS } from './EditorInvoker'
import { createClientHandler } from './createClientHandler'

const logger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as ConstructorParameters<
  typeof ClientEditorBridge
>[2]

describe('ClientEditorBridge', () => {
  let frame: HTMLIFrameElement
  let postToEditor: jest.SpyInstance
  let bridge: ClientEditorBridge

  beforeEach(() => {
    frame = document.createElement('iframe')
    document.body.appendChild(frame)
    postToEditor = jest.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => {})
    const isFlagEnabled = (flag: string) => flag === 'DocsEditorPackageEnabled'
    bridge = new ClientEditorBridge(
      frame,
      createClientHandler({ editorFrame: frame, isFlagEnabled, onEditorError: jest.fn(), logger }),
      logger,
    )
  })

  afterEach(() => {
    bridge.destroy()
    frame.remove()
    jest.useRealTimers()
  })

  test("answers the editor's flag check", async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'checkIfFeatureFlagIsEnabled',
      args: ['DocsEditorPackageEnabled'],
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

  test('sizes the frame for printing to the height the editor reports', async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'updateFrameSize',
      args: [480],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(frame.style.getPropertyValue('--print-min-height')).toBe('480px')
  })

  test('answers an update the editor asks to propagate without sending it anywhere', async () => {
    receiveFromEditor({
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName: 'editorRequestsPropagationOfUpdate',
      args: [{ type: { wrapper: 'du' }, content: new Uint8Array([1]) }, 'DocState'],
      messageId: 'message-1',
    })

    await waitForReply()

    expect(postToEditor).toHaveBeenCalledTimes(1)
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
        args: ['DocsEditorPackageEnabled'],
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

  test('rejects an editor call the editor does not answer in time', async () => {
    jest.useFakeTimers()
    const shown = bridge.editorInvoker.showEditor()

    jest.advanceTimersByTime(EDITOR_CALL_TIMEOUT_MS)

    await expect(shown).rejects.toThrow('Editor did not answer showEditor')
  })

  function receiveFromEditor(data: object, source: Window | null = frame.contentWindow) {
    window.dispatchEvent(new MessageEvent('message', { data, source }))
  }

  function waitForReply() {
    return new Promise((resolve) => setTimeout(resolve, 0))
  }
})
