import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'

import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import { EditorBridgeMessageType } from '@proton/docs-shared/Bridge/EditorBridgeMessageType'
import type { YjsState } from '@proton/docs-shared/YjsState'

import { SingleRevisionViewer } from './SingleRevisionViewer'

// Copied from applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/SingleRevisionViewer.test.tsx,
// on doc2's own bridge: the editor's calls arrive as messages from the view's frame, as in the browser

const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }

vi.mock('~/utils/application-context', () => ({ useApplication: () => ({ logger }) }))
vi.mock('@proton/app-context/useConfig', () => ({ __esModule: true, useConfig: () => ({ APP_VERSION: '1.0.0' }) }))
vi.mock('../__utils/useEditorBasics', () => ({ useIsEditorDarkMode: () => false }))
let mockSheetsMountAfterInitialLoadDisabled = false
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => mockSheetsMountAfterInitialLoadDisabled }))
const mockFrames: HTMLIFrameElement[] = []
/** What the view posted to its editor */
const mockPostedToEditor: {
  type: string
  functionName?: string
  args?: unknown[]
  messageId?: string
  returnValue?: unknown
}[] = []
vi.mock('~/components/document/EditorFrame', () => ({
  EditorFrame: ({
    onFrameReady,
    systemMode,
  }: {
    onFrameReady: (frame: HTMLIFrameElement) => void
    systemMode: string
  }) => {
    useEffect(() => {
      const frame = document.createElement('iframe')
      document.body.appendChild(frame)
      mockFrames.push(frame)
      frame.contentWindow!.postMessage = ((message: (typeof mockPostedToEditor)[number]) => {
        mockPostedToEditor.push(message)
      }) as Window['postMessage']
      void onFrameReady(frame)
    }, [onFrameReady])
    return <div data-testid="editor-frame" data-system-mode={systemMode} />
  },
}))

const STATE = new Uint8Array([1, 2, 3]) as YjsState

describe('SingleRevisionViewer', () => {
  afterEach(() => {
    mockFrames.forEach((frame) => frame.remove())
    mockFrames.length = 0
    mockPostedToEditor.length = 0
    mockSheetsMountAfterInitialLoadDisabled = false
    vi.clearAllMocks()
  })

  it("opens the editor in revision mode as a viewer, sends it the revision's state as one update, then that it has everything, then shows it", async () => {
    const onEditorInvokerRef = vi.fn()
    render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={onEditorInvokerRef} />)
    await act(async () => {})

    expect(screen.getByTestId('editor-frame')).toHaveAttribute('data-system-mode', 'revision')
    expect(callsToEditor()).toEqual([
      {
        functionName: 'initializeEditor',
        args: ['DummyDocumentId', 'DummyUserAddress', 'Viewer', false, '1.0.0', undefined],
      },
      { functionName: 'receiveMessage', args: [{ content: STATE, type: { wrapper: 'du' } }] },
      {
        functionName: 'receiveMessage',
        args: [
          {
            type: { wrapper: 'events', eventType: EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas },
            content: new Uint8Array(),
          },
        ],
      },
      { functionName: 'showEditor', args: [] },
      { functionName: 'setDarkMode', args: [false] },
    ])
    expect(onEditorInvokerRef).toHaveBeenCalledTimes(1)
  })

  it('replaces the editor with an error when the editor reports an irrecoverable error', async () => {
    render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={vi.fn()} />)
    expect(screen.getByTestId('editor-frame')).toBeInTheDocument()

    await reportFromEditor('Loading chunk failed', { irrecoverable: true })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This version could not be loaded. Close the history and try again.',
    )
    expect(screen.queryByTestId('editor-frame')).not.toBeInTheDocument()
    // Logged locally without the message, which may quote document content: `logger.error` would send it to Sentry.
    expect(logger.warn).toHaveBeenCalledWith('Revision editor reported an error', { irrecoverable: true })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('keeps the editor for a recoverable error', async () => {
    render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={vi.fn()} />)

    await reportFromEditor('Something minor', {})

    expect(screen.getByTestId('editor-frame')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    [false, false],
    [true, true],
  ])(
    "answers the editor's check of the sheets mount flag, which is %s, as %s, and of any other flag as false",
    async (flag, answer) => {
      mockSheetsMountAfterInitialLoadDisabled = flag
      render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={vi.fn()} />)

      await callFromEditor('checkIfFeatureFlagIsEnabled', ['SheetsMountAfterInitialLoadDisabled'], 'flag-1')
      await callFromEditor('checkIfFeatureFlagIsEnabled', ['DocsEmojiPicker'], 'flag-2')

      expect(replyTo('flag-1')).toEqual({ returnValue: answer })
      expect(replyTo('flag-2')).toEqual({ returnValue: false })
    },
  )

  it('sends nothing the editor asks to propagate, and answers no call it has no use for', async () => {
    render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={vi.fn()} />)

    await callFromEditor('editorRequestsPropagationOfUpdate', [{ type: { wrapper: 'du' }, content: STATE }], 'du-1')
    await callFromEditor('getAllThreads', [], 'threads-1')

    expect(replyTo('du-1')).toBeUndefined()
    expect(replyTo('threads-1')).toBeUndefined()
  })

  it('stops listening to the editor once it is gone', async () => {
    const { unmount } = render(<SingleRevisionViewer state={STATE} onEditorInvokerRef={vi.fn()} />)
    await act(async () => {})

    unmount()
    await callFromEditor('checkIfFeatureFlagIsEnabled', ['DocsEmojiPicker'], 'flag-1')

    expect(replyTo('flag-1')).toBeUndefined()
  })

  /** What the view asked of its editor, in order */
  function callsToEditor() {
    return mockPostedToEditor
      .filter((message) => message.type === EditorBridgeMessageType.ClientToEditorInvokation)
      .map(({ functionName, args }) => ({ functionName, args }))
  }

  function replyTo(messageId: string) {
    const reply = mockPostedToEditor.find(
      (message) => message.type === EditorBridgeMessageType.ClientToEditorReply && message.messageId === messageId,
    )
    return reply && { returnValue: reply.returnValue }
  }

  async function callFromEditor(functionName: string, args: unknown[], messageId: string) {
    const frame = mockFrames[mockFrames.length - 1]
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: EditorBridgeMessageType.EditorToClientInvokation, functionName, args, messageId },
          source: frame.contentWindow,
        }),
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }

  /** The editor's `reportUserInterfaceError` call, as it reaches the view through its frame */
  function reportFromEditor(message: string, extraInfo: { irrecoverable?: boolean }) {
    return callFromEditor('reportUserInterfaceError', [new Error(message), extraInfo], 'error-1')
  }
})
