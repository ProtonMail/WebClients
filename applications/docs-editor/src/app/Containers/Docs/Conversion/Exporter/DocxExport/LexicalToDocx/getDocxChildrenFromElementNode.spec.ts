import { $getRoot, CLEAR_EDITOR_COMMAND, ParagraphNode, TextNode } from 'lexical'
import { LinkNode } from '@lexical/link'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { ExternalHyperlink, TextRun } from 'docx'
import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../../AllNodes'
import type { DocxExportContext } from './Context'

describe('getDocxChildrenFromElementNode', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  it('should get text runs and external hyperlinks', async () => {
    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)

    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('Hello')
        const linkNode = new LinkNode('https://example.com')
        const textNode2 = new TextNode('World')
        paragraphNode.append(textNode)
        linkNode.append(textNode2)
        paragraphNode.append(linkNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )

    const state = editor.getEditorState()
    const context: DocxExportContext = { state, fetchExternalImageAsBase64: jest.fn() }

    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())

    const children = await getDocxChildrenFromElementNode(paragraphNode, context)

    expect(children).toHaveLength(2)
    expect(children[0]).toBeInstanceOf(TextRun)
    expect(children[1]).toBeInstanceOf(ExternalHyperlink)
  })
})
