import { ParagraphNode, TextNode } from 'lexical'
import { LinkNode } from '@lexical/link'
import { getDocxChildrenFromElementNode } from './getDocxChildrenFromElementNode'
import { ExternalHyperlink, TextRun } from 'docx'
import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'

describe('getDocxChildrenFromElementNode', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  it('should get text runs and external hyperlinks', () => {
    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('Hello')
        const linkNode = new LinkNode('https://example.com')
        const textNode2 = new TextNode('World')
        paragraphNode.append(textNode)
        linkNode.append(textNode2)
        paragraphNode.append(linkNode)

        const children = getDocxChildrenFromElementNode(paragraphNode)

        expect(children).toHaveLength(2)
        expect(children[0]).toBeInstanceOf(TextRun)
        expect(children[1]).toBeInstanceOf(ExternalHyperlink)
      },
      { discrete: true },
    )
  })
})
