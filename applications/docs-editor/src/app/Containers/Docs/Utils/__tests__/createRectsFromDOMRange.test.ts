import { createRectsFromDOMRange } from '../createRectsFromDOMRange'
import { createEditor } from 'lexical'

describe('createRectsFromDOMRange', () => {
  let editor: ReturnType<typeof createEditor>
  let range: Range
  let rootElement: HTMLDivElement

  beforeEach(() => {
    // Set up DOM elements
    rootElement = document.createElement('div')
    editor = createEditor()
    editor.getRootElement = jest.fn().mockReturnValue(rootElement)
    range = new Range()
    // Mock getClientRects to control the test scenarios
    range.getClientRects = jest.fn()
  })

  it('returns empty array when editor root is null', () => {
    editor.getRootElement = jest.fn().mockReturnValue(null)
    const result = createRectsFromDOMRange(editor, range)
    expect(result).toEqual([])
  })

  it('sorts rects from top-left to bottom-right', () => {
    const mockRects = [
      { top: 10, left: 20, height: 10, width: 50 },
      { top: 0, left: 10, height: 10, width: 50 },
      { top: 20, left: 30, height: 10, width: 50 },
    ]
    range.getClientRects = jest.fn().mockReturnValue(mockRects)

    const result = createRectsFromDOMRange(editor, range)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(mockRects[1])
    expect(result[1]).toEqual(mockRects[0])
    expect(result[2]).toEqual(mockRects[2])
  })

  it('removes overlapping rects', () => {
    const mockRects = [
      { top: 0, left: 0, height: 20, width: 50 },
      { top: 10, left: 10, height: 20, width: 30 }, // Overlaps with first rect
    ]
    range.getClientRects = jest.fn().mockReturnValue(mockRects)

    const result = createRectsFromDOMRange(editor, range)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockRects[0])
  })

  it('keeps rects with small vertical overlap within 3px tolerance', () => {
    const mockRects = [
      { top: 0, left: 0, height: 20, width: 30 },
      { top: 2, left: 40, height: 20, width: 30 }, // Within 3px tolerance
    ]
    range.getClientRects = jest.fn().mockReturnValue(mockRects)

    const result = createRectsFromDOMRange(editor, range)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockRects[0])
    expect(result[1]).toEqual(mockRects[1])
  })

  it('handles floating point values correctly', () => {
    const mockRects = [
      { top: 0, left: 0, height: 20.6, width: 50.3 },
      { top: 20.5, left: 50.2, height: 20, width: 30 },
    ]
    range.getClientRects = jest.fn().mockReturnValue(mockRects)

    const result = createRectsFromDOMRange(editor, range)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockRects[0])
    expect(result[1]).toEqual(mockRects[1])
  })
})
