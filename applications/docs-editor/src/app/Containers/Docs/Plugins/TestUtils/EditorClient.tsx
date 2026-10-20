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
import * as ReactTestUtils from './react-test-utils'
import { YjsReadonlyPlugin } from '../YjsReadonly/YjsReadonlyPlugin'
import type { Provider } from '@lexical/yjs'
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import { applyUpdate, Doc } from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import type { DocsDocumentAdapter } from '../../contract/DocsDocumentAdapter'
import { DocsDocProvider } from '../Collaboration/DocsDocProvider'

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

export type YjsUpdate = Uint8Array<ArrayBuffer>

/** Stands in for the host's document state. */
class FakeDocState implements DocsDocumentAdapter {
  readonly doc = new Doc()
  readonly awareness = new Awareness(this.doc)

  constructor(onLocalUpdate: (update: YjsUpdate) => void) {
    this.doc.on('update', (update, origin) => {
      if (origin !== this) {
        onLocalUpdate(update as YjsUpdate)
      }
    })
  }

  receiveUpdate(update: YjsUpdate) {
    applyUpdate(this.doc, update, this)
  }
}

export class EditorClient {
  editor: LexicalEditor
  state: FakeDocState
  provider: () => Provider
  docMap: Map<string, Doc>
  propagatedUpdates: YjsUpdate[]
  container: HTMLElement
  reactRoot: Root
  private safeMode: boolean = false
  docId = `${Math.random()}`

  constructor(
    editor: LexicalEditor,
    state: FakeDocState,
    provider: () => Provider,
    docMap: Map<string, Doc>,
    propagatedUpdates: YjsUpdate[],
    container: HTMLElement,
    reactRoot: Root,
  ) {
    this.editor = editor
    this.state = state
    this.provider = provider
    this.docMap = docMap
    this.propagatedUpdates = propagatedUpdates
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
      const onEditorReadyToReceiveUpdates = jest.fn()
      const lexicalError = undefined

      const TestPlugin = () => {
        ;[this.editor] = useLexicalComposerContext()
        return null
      }

      return (
        <CollaborationContext.Provider
          value={{
            yjsDocMap: this.docMap,
            name: `name-${this.state.doc.clientID}`,
            color: 'color-123',
            clientID: this.state.doc.clientID,
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
              onEditorReadyToReceiveUpdates={onEditorReadyToReceiveUpdates}
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
    this.state.awareness.destroy()
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

  const docMap = new Map<string, Doc>()
  const propagatedUpdates: YjsUpdate[] = []

  const state = new FakeDocState((update) => propagatedUpdates.push(update))

  const provider = (): Provider => {
    return new DocsDocProvider(state.awareness)
  }

  let client: EditorClient

  await ReactTestUtils.act(async () => {
    const TestBase = () => {
      const [lexicalEditor] = useLexicalComposerContext()
      // Assign the editor when the component mounts
      editor = lexicalEditor
      return client.createTestBase()
    }

    client = new EditorClient(editor!, state, provider, docMap, propagatedUpdates, container, reactRoot)
    docMap.set(client.docId, state.doc)

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
