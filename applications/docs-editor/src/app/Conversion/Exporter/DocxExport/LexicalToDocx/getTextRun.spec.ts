import type { IRunOptions } from 'docx'
import { TextRun } from 'docx'
import { getTextRun as _getTextRun } from './getTextRun'
import { createHeadlessEditor } from '@lexical/headless'
import { LinkNode } from '@lexical/link'
import { $getRoot, ParagraphNode, TextNode } from 'lexical'
import { DEFAULT_FONT_FACE, FONT_FACES } from '@proton/components/components/editor/constants'
import { AllNodes } from '../../../../AllNodes'

jest.mock('docx', () => ({
  ...jest.requireActual('docx'),
  TextRun: jest.fn(),
}))

describe('getTextRun', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  const getTextRun = _getTextRun as (...args: Parameters<typeof _getTextRun>) => IRunOptions

  beforeEach(() => {
    ;(TextRun as jest.Mock).mockImplementation((options: IRunOptions) => options)
  })

  it('should get text content', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      {
        discrete: true,
      },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.text).toBe('text content')
  })

  it('should have formating options', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.toggleFormat('bold')
        textNode.toggleFormat('italic')
        textNode.toggleFormat('underline')
        textNode.toggleFormat('strikethrough')
        textNode.toggleFormat('superscript')
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.bold).toBe(true)
    expect(result.italics).toBe(true)
    expect(result.underline).toEqual({ type: 'single' })
    expect(result.strike).toBe(true)
    expect(result.superScript).toBe(true)
  })

  it('should have color options', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.setStyle('color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);')
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.color).toBe('000000')
    expect(result.shading).toEqual({ type: 'clear', fill: 'ffffff' })
  })

  it('should have font size options, converted from px to pt', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.setStyle('font-size: 20px;')
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.size).toBe('15pt')
  })

  it('should have font family if explicitly set', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.setStyle(`font-family: ${FONT_FACES.MONOSPACE.value};`)
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.font).toBe(FONT_FACES.MONOSPACE.value)
  })

  it('should have default font family if not explicitly set', () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        paragraphNode.append(textNode)
        $getRoot().append(paragraphNode)
      },
      { discrete: true },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const textNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result = getTextRun(textNode, paragraphNode, state)
    expect(result.font).toBe(DEFAULT_FONT_FACE)
  })

  it('should have link style if parent node is link', () => {
    editor.update(
      () => {
        $getRoot().clear()

        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        paragraphNode.append(textNode)

        const linkNode = new LinkNode('https://example.com')
        linkNode.append(new TextNode('link content'))

        $getRoot().append(paragraphNode)
        $getRoot().append(linkNode)
      },
      { discrete: true },
    )

    const state = editor.getEditorState()

    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const paragraphTextNode = state.read(() => paragraphNode.getFirstChildOrThrow<TextNode>())
    const result1 = getTextRun(paragraphTextNode, paragraphNode, state)
    expect(result1.style).toBeUndefined()

    const linkNode = state.read(() => $getRoot().getLastChildOrThrow<LinkNode>())
    const textNode = state.read(() => linkNode.getFirstChildOrThrow<TextNode>())
    const result2 = getTextRun(textNode, linkNode, state)
    expect(result2.style).toBe('Hyperlink')
  })
})
