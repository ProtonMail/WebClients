import { getDOMRangeRect } from '../getDOMRangeRect'

describe('getDOMRangeRect', () => {
  let rootElement: HTMLDivElement
  let selection: Selection
  let range: Range

  beforeEach(() => {
    rootElement = document.createElement('div')
    document.body.appendChild(rootElement)
    selection = window.getSelection()!
    selection.removeAllRanges()
    range = document.createRange()
  })

  afterEach(() => {
    selection.removeAllRanges()
    rootElement.remove()
  })

  it('positions a root-anchored selection inside an empty editor', () => {
    rootElement.style.paddingTop = '8px'
    rootElement.style.paddingLeft = '12px'
    rootElement.style.lineHeight = '24px'
    rootElement.getBoundingClientRect = jest.fn().mockReturnValue(new DOMRect(20, 30, 200, 100))
    range.setStart(rootElement, 0)
    selection.addRange(range)

    const rect = getDOMRangeRect(selection, rootElement)

    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([32, 62, 0, 0])
  })

  it('uses the innermost element when the selection is anchored at the editor root', () => {
    const paragraph = document.createElement('p')
    const link = document.createElement('a')
    paragraph.appendChild(link)
    rootElement.appendChild(paragraph)
    link.getBoundingClientRect = jest.fn().mockReturnValue(new DOMRect(40, 50, 60, 20))
    range.setStart(rootElement, 0)
    selection.addRange(range)

    const rect = getDOMRangeRect(selection, rootElement)

    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([40, 50, 60, 20])
  })

  it('encloses all client rects for a selection spanning multiple lines', () => {
    const text = document.createTextNode('selected text')
    rootElement.appendChild(text)
    range.selectNodeContents(text)
    selection.addRange(range)
    selection.getRangeAt(0).getClientRects = jest
      .fn()
      .mockReturnValue([new DOMRect(40, 50, 60, 20), new DOMRect(20, 70, 35, 20)])

    const rect = getDOMRangeRect(selection, rootElement)

    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([20, 50, 80, 40])
  })

  it('uses the start element when a collapsed range has no client rect', () => {
    const link = document.createElement('a')
    rootElement.appendChild(link)
    range.setStart(link, 0)
    selection.addRange(range)
    const selectedRange = selection.getRangeAt(0)
    selectedRange.getClientRects = jest.fn().mockReturnValue([])
    selectedRange.getBoundingClientRect = jest.fn().mockReturnValue(new DOMRect())
    link.getBoundingClientRect = jest.fn().mockReturnValue(new DOMRect(40, 50, 60, 20))

    const rect = getDOMRangeRect(selection, rootElement)

    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([40, 50, 60, 20])
  })
})
