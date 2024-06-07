import type { LexicalEditor, NodeKey } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import AddCommentIcon from '../../Icons/AddCommentIcon'

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
      const { right } = rootElement.getBoundingClientRect()
      const { top } = anchorElement.getBoundingClientRect()
      const { top: rootTop } = rootElementParent.getBoundingClientRect()
      boxElem.style.left = `${right}px`
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
      <button
        aria-label="Add comment"
        className="flex cursor-pointer items-center justify-center rounded-lg border-0 bg-none p-2.5 hover:bg-[--background-weak]"
        onClick={onAddComment}
      >
        <AddCommentIcon className="h-4 w-4 fill-current" />
      </button>
    </div>
  )
}
