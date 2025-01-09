import type { LexicalEditor } from 'lexical'

// Original: https://github.com/facebook/lexical/blob/main/packages/lexical-selection/src/utils.ts#L124
// Modified to remove a check that would skip rects if they spanned the width of the editor, and also
// flooring some float values before comparing so that less than a px of overlap doesn't cause a whole
// rect to get skipped.

/**
 * Creates DOMRects, generally used to help the editor find a specific location on the screen.
 * @param editor - The lexical editor
 * @param range - A fragment of a document that can contain nodes and parts of text nodes.
 * @returns The selectionRects as an array.
 */
export function createRectsFromDOMRange(editor: LexicalEditor, range: Range): DOMRect[] {
  const rootElement = editor.getRootElement()

  if (rootElement === null) {
    return []
  }

  const selectionRects = Array.from(range.getClientRects())
  let selectionRectsLength = selectionRects.length

  //sort rects from top left to bottom right.
  selectionRects.sort((a, b) => {
    const top = a.top - b.top
    // Some rects match position closely, but not perfectly,
    // so we give a 3px tolerance.
    if (Math.abs(top) <= 3) {
      return a.left - b.left
    }
    return top
  })

  let prevRect
  for (let i = 0; i < selectionRectsLength; i++) {
    const selectionRect = selectionRects[i]
    // Exclude rects that overlap preceding Rects in the sorted list.
    const isOverlappingRect =
      prevRect &&
      prevRect.top <= selectionRect.top &&
      Math.floor(prevRect.top + prevRect.height) > Math.floor(selectionRect.top) &&
      Math.floor(prevRect.left + prevRect.width) > Math.floor(selectionRect.left)
    if (isOverlappingRect) {
      selectionRects.splice(i--, 1)
      selectionRectsLength--
      continue
    }
    prevRect = selectionRect
  }

  return selectionRects
}
