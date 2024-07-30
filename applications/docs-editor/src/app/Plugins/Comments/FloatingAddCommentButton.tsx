import type { LexicalEditor, NodeKey } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { c } from 'ttag'
import AddCommentIcon from '../../Icons/AddCommentIcon'
import ToolbarTooltip from '../../Toolbar/ToolbarTooltip'
import { ShortcutLabel } from '../KeyboardShortcuts/ShortcutLabel'

export function FloatingAddCommentButton({
  anchorKey,
  editor,
  onAddComment,
}: {
  anchorKey: NodeKey
  editor: LexicalEditor
  onAddComment: () => void
}): JSX.Element {
  const boxRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const boxElem = boxRef.current
    const rootElement = editor.getRootElement()
    const rootElementParent = rootElement?.parentElement
    const anchorElement = editor.getElementByKey(anchorKey)

    if (boxElem !== null && rootElement !== null && anchorElement !== null && rootElementParent) {
      const paddingRight = parseFloat(getComputedStyle(rootElementParent).paddingRight)
      const { right } = rootElement.getBoundingClientRect()
      const { top } = anchorElement.getBoundingClientRect()
      const { top: rootTop } = rootElementParent.getBoundingClientRect()
      boxElem.style.left = `${right - (paddingRight || 0)}px`
      boxElem.style.top = `${top - rootTop + rootElementParent.scrollTop}px`
    }
  }, [anchorKey, editor])

  useEffect(() => {
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
    }
  }, [editor, updatePosition])

  useLayoutEffect(() => {
    updatePosition()
  }, [anchorKey, editor, updatePosition])

  return (
    <div className="shadow-raised border-weak bg-norm absolute z-10 rounded-lg border p-0.5" ref={boxRef}>
      <ToolbarTooltip
        originalPlacement="right"
        title={<ShortcutLabel label={c('Action').t`Add comment`} shortcut="INSERT_COMMENT_SHORTCUT" />}
      >
        <button
          aria-label="Add comment"
          className="flex cursor-pointer items-center justify-center rounded-lg border-0 bg-none p-2.5 hover:bg-[--background-weak]"
          onClick={onAddComment}
          data-testid="floating-add-comment-button"
        >
          <AddCommentIcon className="h-4 w-4 fill-current" />
        </button>
      </ToolbarTooltip>
    </div>
  )
}
