function mergeRects(rects: DOMRect[]): DOMRect {
  const left = Math.min(...rects.map((rect) => rect.left))
  const top = Math.min(...rects.map((rect) => rect.top))
  const right = Math.max(...rects.map((rect) => rect.right))
  const bottom = Math.max(...rects.map((rect) => rect.bottom))

  return new DOMRect(left, top, right - left, bottom - top)
}

export function getDOMRangeRect(nativeSelection: Selection, rootElement: HTMLElement): DOMRect {
  const domRange = nativeSelection.getRangeAt(0)
  const startContainer = domRange.startContainer

  let rect

  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild as HTMLElement
    }
    if (inner !== rootElement) {
      rect = inner.getBoundingClientRect()
    } else {
      // If there are no children in the root element, we calculate
      // the rect based on the root's padding and line height
      const rootRect = rootElement.getBoundingClientRect()
      const rootElementStyles = getComputedStyle(rootElement)
      const topPadding = parseFloat(rootElementStyles.paddingTop)
      const lineHeight = parseFloat(rootElementStyles.lineHeight)
      const top = rootRect.top + topPadding + lineHeight
      const leftPadding = parseFloat(rootElementStyles.paddingLeft)
      const left = rootRect.left + leftPadding
      rect = new DOMRect(left, top, 0, 0)
    }
  } else {
    const clientRects = domRange.getClientRects()
    if (clientRects.length > 0) {
      // Merge all client rects into one if there are multiple
      rect = mergeRects(Array.from(clientRects))
    } else {
      rect = domRange.getBoundingClientRect()
      // If the range is collapsed, use the start container's rect
      if (rect.width === 0 && rect.height === 0 && startContainer instanceof Element) {
        rect = startContainer.getBoundingClientRect()
      }
    }
  }

  return rect
}
