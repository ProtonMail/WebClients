import { createHeadlessEditor } from '@lexical/headless'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $createImageNode } from './ImageNode'
import { $isImageNode } from './isImageNode'

describe('ImageNode', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  beforeAll(() => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation((obj: any) => obj)
    editor.getRootElement = jest.fn().mockImplementation(() => ({
      paddingLeft: '10px',
      paddingRight: '10px',
      paddingTop: '0px',
      paddingBottom: '0px',
      getBoundingClientRect: () => ({
        width: 320,
        height: 480,
        top: 0,
        left: 0,
        right: 320,
        bottom: 480,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    }))
  })

  it('does not import remote image URLs from HTML', () => {
    const dom = new DOMParser().parseFromString(
      '<img src="https://example.invalid/p.png?d=1" alt="tracker" />',
      'text/html',
    )

    let hasImageNode = false
    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, dom)
        hasImageNode = nodes.some($isImageNode)
      },
      { discrete: true },
    )
    expect(hasImageNode).toBe(false)
  })

  it('imports embedded data URLs from HTML', () => {
    const dom = new DOMParser().parseFromString(
      '<img src="data:image/png;base64,iVBORw0KGgo=" alt="embedded" />',
      'text/html',
    )

    let hasImageNode = false
    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, dom)
        hasImageNode = nodes.some($isImageNode)
      },
      { discrete: true },
    )
    expect(hasImageNode).toBe(true)
  })

  it('does not export remote image URLs to HTML', () => {
    editor.update(
      () => {
        $getRoot().clear()
        $getRoot().append(
          $createImageNode({
            src: 'https://example.invalid/p.png?d=1',
            altText: 'tracker',
          }),
        )
      },
      { discrete: true },
    )

    const html = editor.getEditorState().read(() => $generateHtmlFromNodes(editor))
    expect(html).not.toContain('https://example.invalid/p.png?d=1')
  })

  it('exports embedded data URLs to HTML', () => {
    editor.update(
      () => {
        $getRoot().clear()
        $getRoot().append(
          $createImageNode({
            src: 'data:image/png;base64,iVBORw0KGgo=',
            altText: 'embedded',
          }),
        )
      },
      { discrete: true },
    )

    const html = editor.getEditorState().read(() => $generateHtmlFromNodes(editor))
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=')
  })
})
