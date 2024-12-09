import type { LexicalEditor } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, CLEAR_HISTORY_COMMAND } from 'lexical'
import { AllNodes } from '../../AllNodes'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import * as ReactTestUtils from '../../Utils/react-test-utils'
import type { Logger } from '@proton/utils/logs'
import { YjsReadonlyPlugin } from '../YjsReadonly/YjsReadonlyPlugin'
import type { Provider } from '@lexical/yjs'
import { LexicalDocProvider } from '@proton/docs-shared/lib/Doc/LexicalDocProvider'
import type { DocStateCallbacks } from '@proton/docs-shared/lib/Doc/DocStateCallbacks'
import type { RtsMessagePayload, YDocMap } from '@proton/docs-shared'
import { DocState, DocWillInitializeWithEmptyNodeEvent } from '@proton/docs-shared'
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext'

const logger = {
  info: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger

export class EditorClient {
  editor: LexicalEditor
  state: DocState
  provider: () => Provider
  docMap: YDocMap
  propagatedMessages: RtsMessagePayload[]
  container: HTMLElement
  reactRoot: Root
  private safeMode: boolean = false
  docId = `${Math.random()}`

  constructor(
    editor: LexicalEditor,
    state: DocState,
    provider: () => Provider,
    docMap: YDocMap,
    propagatedMessages: RtsMessagePayload[],
    container: HTMLElement,
    reactRoot: Root,
  ) {
    this.editor = editor
    this.state = state
    this.provider = provider
    this.docMap = docMap
    this.propagatedMessages = propagatedMessages
    this.container = container
    this.reactRoot = reactRoot
    this.safeMode = false
  }

  async enableSafeMode(enabled: boolean = true) {
    await ReactTestUtils.act(async () => {
      this.safeMode = enabled
      this.reactRoot.render(this.createTestBase())
    })
  }

  createTestBase() {
    const TestBase = () => {
      const onLoadResult = jest.fn()
      const lexicalError = undefined

      const TestPlugin = () => {
        ;[this.editor] = useLexicalComposerContext()
        return null
      }

      return (
        <CollaborationContext.Provider
          value={{
            yjsDocMap: this.docMap,
            name: `name-${this.state.getClientId()}`,
            color: 'color-123',
            clientID: this.state.getClientId(),
            isCollabActive: false,
          }}
        >
          <LexicalComposer
            initialConfig={{
              namespace: 'test',
              nodes: AllNodes,
              editorState: null,
              onError: console.error,
            }}
          >
            <RichTextPlugin
              contentEditable={<ProtonContentEditable isSuggestionMode={false} />}
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <YjsReadonlyPlugin
              id={this.docId}
              providerFactory={this.provider}
              onLoadResult={onLoadResult}
              lexicalError={lexicalError}
              logger={logger}
              safeMode={this.safeMode}
            />
            <TestPlugin />
          </LexicalComposer>
        </CollaborationContext.Provider>
      )
    }
    return <TestBase />
  }

  async updateEditor(fn: () => void) {
    await ReactTestUtils.act(async () => {
      await this.editor.update(fn)
    })
  }

  async bootstrapWithEmptyParagraph() {
    this.state.doc.emit(DocWillInitializeWithEmptyNodeEvent, [true, this.state.doc])

    await this.updateEditor(() => {
      this.editor.update(
        () => {
          const root = $getRoot()
          if (!root.isEmpty()) {
            throw new Error('Root is not empty')
          }

          root.clear()

          const paragraph = $createParagraphNode()
          root.append(paragraph)
        },
        {
          discrete: true,
        },
      )
    })

    this.editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }

  async insertText(text: string) {
    await this.updateEditor(() => {
      const root = $getRoot()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(text))
      root.append(paragraph)
    })

    return text
  }

  getStateAsJson() {
    return JSON.stringify(this.editor.getEditorState().toJSON())
  }

  async cleanup() {
    this.state.destroy()
    await ReactTestUtils.act(async () => {
      this.reactRoot.unmount()
      await Promise.resolve().then()
    })
    document.body.removeChild(this.container)
  }
}

export async function createEditorClient(): Promise<EditorClient> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const reactRoot = createRoot(container)
  let editor: LexicalEditor | null = null

  const docMap = new Map()
  const propagatedMessages: RtsMessagePayload[] = []

  const state = new DocState(
    {
      handleAwarenessStateUpdate: jest.fn(),
      docStateRequestsPropagationOfUpdate: (update: RtsMessagePayload) => {
        if (update.type.wrapper === 'du') {
          propagatedMessages.push(update)
        }
      },
    } as unknown as DocStateCallbacks,
    logger,
  )

  state.onEditorReadyToReceiveUpdates()

  const provider = (): Provider => {
    return new LexicalDocProvider(state)
  }

  let client: EditorClient

  await ReactTestUtils.act(async () => {
    const TestBase = () => {
      const [lexicalEditor] = useLexicalComposerContext()
      // Assign the editor when the component mounts
      editor = lexicalEditor
      return client.createTestBase()
    }

    client = new EditorClient(editor!, state, provider, docMap, propagatedMessages, container, reactRoot)
    docMap.set(client.docId, state.getDoc())

    reactRoot.render(
      <LexicalComposer
        initialConfig={{
          namespace: 'test',
          nodes: AllNodes,
          editorState: null,
          onError: console.error,
        }}
      >
        <TestBase />
      </LexicalComposer>,
    )
  })

  return client!
}
