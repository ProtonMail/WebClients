import { createDOMRange } from '@lexical/selection'
import type { LexicalEditor, RangeSelection } from 'lexical'

export function getRangeSelectionRect(editor: LexicalEditor, selection: RangeSelection) {
  const anchor = selection.anchor
  const focus = selection.focus
  const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset)
  if (!range) {
    return
  }
  return range.getBoundingClientRect()
}
