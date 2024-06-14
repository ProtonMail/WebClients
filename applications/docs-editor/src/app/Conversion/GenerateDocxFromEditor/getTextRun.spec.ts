import { IRunOptions, TextRun } from 'docx'
import { getTextRun as _getTextRun } from './getTextRun'
import { createHeadlessEditor } from '@lexical/headless'
import { LinkNode } from '@lexical/link'
import { ParagraphNode, TextNode } from 'lexical'
import { AllNodes } from '../../AllNodes'

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
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        paragraphNode.append(textNode)
        const result = getTextRun(textNode, paragraphNode)
        expect(result.text).toBe('text content')
      },
      {
        discrete: true,
      },
    )
  })

  it('should have formating options', () => {
    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.toggleFormat('bold')
        textNode.toggleFormat('italic')
        textNode.toggleFormat('underline')
        textNode.toggleFormat('strikethrough')
        textNode.toggleFormat('superscript')
        paragraphNode.append(textNode)

        const result = getTextRun(textNode, paragraphNode)

        expect(result.bold).toBe(true)
        expect(result.italics).toBe(true)
        expect(result.underline).toEqual({ type: 'single' })
        expect(result.strike).toBe(true)
        expect(result.superScript).toBe(true)
      },
      { discrete: true },
    )
  })

  it('should have color options', () => {
    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.setStyle('color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);')
        paragraphNode.append(textNode)

        const result = getTextRun(textNode, paragraphNode)

        expect(result.color).toBe('000000')
        expect(result.shading).toEqual({ type: 'clear', fill: 'ffffff' })
      },
      { discrete: true },
    )
  })

  it('should have font size options, converted from px to pt', () => {
    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        textNode.setStyle('font-size: 20px;')
        paragraphNode.append(textNode)

        const result = getTextRun(textNode, paragraphNode)

        expect(result.size).toBe('15pt')
      },
      { discrete: true },
    )
  })

  it('should have link style if parent node is link', () => {
    editor.update(
      () => {
        const paragraphNode = new ParagraphNode()
        const textNode = new TextNode('text content')
        paragraphNode.append(textNode)

        const result1 = getTextRun(textNode, paragraphNode)
        expect(result1.style).toBeUndefined()

        const linkNode = new LinkNode('https://example.com')
        linkNode.append(textNode)

        const result2 = getTextRun(textNode, linkNode)

        expect(result2.style).toBe('Hyperlink')
      },
      { discrete: true },
    )
  })
})
