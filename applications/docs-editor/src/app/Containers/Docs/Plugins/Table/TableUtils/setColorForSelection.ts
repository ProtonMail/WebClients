import { $patchStyleText, getCSSFromStyleObject, getStyleObjectFromCSS } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import type { ElementNode, LexicalEditor } from 'lexical'
import { $getSelection, $isElementNode } from 'lexical'

export function setColorForSelection(editor: LexicalEditor, color: string | null) {
  editor.update(
    () => {
      const selection = $getSelection()
      if (!$isTableSelection(selection)) {
        return
      }
      $patchStyleText(selection, { color })
      for (const node of selection.getNodes()) {
        if ($isElementNode(node) && node.isEmpty()) {
          $setTextColorForEmptyElement(node, color)
        }
      }
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}

/** The caret takes its style from an empty element's text style, so text typed there later gets the color. */
function $setTextColorForEmptyElement(element: ElementNode, color: string | null) {
  const { color: _previousColor, ...styleWithoutColor } = getStyleObjectFromCSS(element.getTextStyle())
  element.setTextStyle(getCSSFromStyleObject(color ? { ...styleWithoutColor, color } : styleWithoutColor))
}
