import type { LexicalEditor, RangeSelection } from 'lexical'
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CommentsComposer } from './CommentsComposer'
import { c } from 'ttag'
import { Icon, ToolbarButton } from '@proton/components'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { useCommentsContext } from './CommentsContext'

export function CommentInputBox({ editor, cancelAddComment }: { editor: LexicalEditor; cancelAddComment: () => void }) {
  const textContentRef = useRef('')
  const { controller, setThreadToFocus } = useCommentsContext()

  const boxRef = useRef<HTMLDivElement>(null)
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  )
  const selectionRef = useRef<RangeSelection | null>(null)

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone()
        const anchor = selection.anchor
        const focus = selection.focus
        const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset)
        const boxElem = boxRef.current
        const rootElement = editor.getRootElement()
        const parentContainer = rootElement?.parentElement
        if (range !== null && boxElem !== null && parentContainer) {
          const parentScrollTop = parentContainer.scrollTop

          const editorRect = rootElement.getBoundingClientRect()
          const parentRect = parentContainer.getBoundingClientRect()

          const { top } = range.getBoundingClientRect()
          const selectionRects = createRectsFromDOMRange(editor, range)
          boxElem.style.left = `${editorRect.right + 10}px`
          boxElem.style.top = `${top + parentScrollTop - parentRect.top}px`

          const selectionRectsLength = selectionRects.length
          const { container } = selectionState
          const elements: HTMLSpanElement[] = selectionState.elements
          const elementsLength = elements.length

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i]
            let elem: HTMLSpanElement = elements[i]
            if (elem === undefined) {
              elem = document.createElement('span')
              elements[i] = elem
              container.appendChild(elem)
            }
            const color = '255, 153, 0'
            const style = `position:absolute;top:${selectionRect.top + parentScrollTop - parentRect.top}px;left:${selectionRect.left - parentRect.left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`
            elem.style.cssText = style
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i]
            container.removeChild(elem)
            elements.pop()
          }
        }
      }
    })
  }, [editor, selectionState])

  useLayoutEffect(() => {
    updateLocation()
    const selectionStateContainer = selectionState.container
    const parentContainer = editor.getRootElement()?.parentElement
    if (parentContainer) {
      parentContainer.appendChild(selectionStateContainer)
      return () => {
        parentContainer.removeChild(selectionStateContainer)
      }
    }
  }, [editor, selectionState.container, updateLocation])

  useEffect(() => {
    const clickOutsideHandler = (event: MouseEvent) => {
      if (!boxRef.current) {
        return
      }
      if (boxRef.current.contains(event.target as Node)) {
        return
      }
      if (textContentRef.current.length === 0) {
        cancelAddComment()
      }
      event.preventDefault()
      event.stopPropagation()
      if (confirm(c('Confirm').t`Discard comment?`)) {
        cancelAddComment()
      }
    }

    document.addEventListener('pointerdown', clickOutsideHandler)

    window.addEventListener('resize', updateLocation)

    return () => {
      document.removeEventListener('pointerdown', clickOutsideHandler)

      window.removeEventListener('resize', updateLocation)
    }
  }, [cancelAddComment, updateLocation])

  const onSubmit = useCallback(
    (content: string) => {
      if (selectionRef.current) {
        controller
          .createThread(content)
          .then((thread) => {
            if (thread) {
              setThreadToFocus(thread.id)
            }
          })
          .catch(sendErrorMessage)
        selectionRef.current = null
      }
    },
    [controller, setThreadToFocus],
  )

  return (
    <div
      className="bg-norm border-norm absolute left-0 top-0 z-10 w-[250px] rounded border text-sm shadow-lg"
      ref={boxRef}
    >
      <CommentsComposer
        autoFocus
        className="py-1.5"
        placeholder={c('Placeholder').t`Add a comment...`}
        onSubmit={onSubmit}
        onCancel={cancelAddComment}
        onTextContentChange={(textContent) => (textContentRef.current = textContent)}
        buttons={(canSubmit, submitComment) => (
          <ToolbarButton
            className="bg-primary rounded-full p-1"
            title={c('Action').t`Add comment`}
            icon={<Icon name="arrow-up" size={3.5} />}
            disabled={!canSubmit}
            onClick={submitComment}
          />
        )}
      />
    </div>
  )
}
