import { createHeadlessEditor } from '@lexical/headless'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $createPageBreakNode, $isPageBreakNode, PageBreakNode } from './PageBreakNode'

describe('PageBreakNode', () => {
  it('serializes explicit page breaks in editor state', () => {
    const editor = createHeadlessEditor({
      nodes: AllNodes,
      onError: console.error,
    })

    editor.update(
      () => {
        $getRoot().append($createPageBreakNode())
      },
      { discrete: true },
    )

    const [child] = editor.getEditorState().read(() => $getRoot().getChildren())
    expect($isPageBreakNode(child)).toBe(true)
    expect(child.exportJSON()).toMatchObject({
      type: PageBreakNode.getType(),
      version: 1,
    })
  })

  it('round-trips through HTML export and import', () => {
    const editor = createHeadlessEditor({
      nodes: AllNodes,
      onError: console.error,
    })

    editor.update(
      () => {
        $getRoot().append($createPageBreakNode())
      },
      { discrete: true },
    )

    const html = editor.getEditorState().read(() => $generateHtmlFromNodes(editor))
    expect(html).toContain('data-lexical-page-break="true"')

    const dom = new DOMParser().parseFromString(html, 'text/html')
    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, dom)
        expect(nodes.some($isPageBreakNode)).toBe(true)
      },
      { discrete: true },
    )
  })
})
