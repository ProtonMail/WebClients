import type { LexicalEditor, RangeSelection } from 'lexical'
import { $getNodeByKey, $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import { BEFOREINPUT_EVENT_COMMAND } from '../../Commands/Events'

/** Use the same input path as typing so suggestion mode owns the edit. */
export function insertEmoji(
  editor: LexicalEditor,
  native: string,
  selection?: RangeSelection,
  keepFocus = false,
): void {
  editor.update(
    () => {
      if (!editor.isEditable()) {
        return
      }
      if (selection) {
        // A remote edit can delete a saved selection while the picker has focus.
        const anchor = $getNodeByKey(selection.anchor.key)
        const focus = $getNodeByKey(selection.focus.key)
        if (!anchor?.isAttached() || !focus?.isAttached()) {
          return
        }
        $setSelection(selection.clone())
      }
      const current = $getSelection()
      if (!$isRangeSelection(current)) {
        return
      }
      const event = new InputEvent('beforeinput', {
        inputType: current.isCollapsed() ? 'insertText' : 'insertReplacementText',
        data: native,
        bubbles: true,
        cancelable: true,
      })
      if (!editor.dispatchCommand(BEFOREINPUT_EVENT_COMMAND, event)) {
        current.insertText(native)
      }
    },
    { discrete: true, tag: keepFocus ? 'skip-dom-selection' : undefined },
  )
}
