import type { LexicalEditor, RangeSelection } from 'lexical'
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CommentsComposer } from './CommentsComposer'
import { c } from 'ttag'
import { Icon, ToolbarButton } from '@proton/components'
import { useCommentsContext } from './CommentsContext'

export function CommentInputBox({ editor, cancelAddComment }: { editor: LexicalEditor; cancelAddComment: () => void }) {
  const textContentRef = useRef('')
  const { controller, setThreadToFocus, setCurrentCommentDraft } = useCommentsContext()

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
        const rootElement = editor.getRootElement()
        const parentContainer = rootElement?.parentElement
        if (range !== null && parentContainer) {
          const parentScrollTop = parentContainer.scrollTop
          const parentRect = parentContainer.getBoundingClientRect()

          const selectionRects = createRectsFromDOMRange(editor, range)
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
      if (!textContentRef.current) {
        cancelAddComment()
        return
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
    async (content: string) => {
      if (selectionRef.current) {
        const success = await controller.createCommentThread(content).then((thread) => {
          if (thread) {
            setThreadToFocus(thread.id)
          }
          return !!thread
        })

        if (success) {
          selectionRef.current = null
          textContentRef.current = ''
          cancelAddComment()
          setCurrentCommentDraft(undefined)
        }

        return success
      }
      return false
    },
    [cancelAddComment, controller, setThreadToFocus, setCurrentCommentDraft],
  )

  const onTextChange = useCallback(
    (textContent: string) => {
      textContentRef.current = textContent
      setCurrentCommentDraft(textContent)
    },
    [setCurrentCommentDraft],
  )

  return (
    <div
      className="bg-norm shadow-lifted border-norm relative rounded border text-sm print:hidden"
      ref={boxRef}
      data-testid="comments-floating-input"
    >
      <CommentsComposer
        autoFocus
        className="px-2.5 py-2"
        placeholder={c('Placeholder').t`Add a comment...`}
        onSubmit={onSubmit}
        onCancel={cancelAddComment}
        onTextContentChange={onTextChange}
        buttons={(canSubmit, submitComment) => (
          <ToolbarButton
            className="bg-primary rounded-full p-1"
            title={c('Action').t`Add comment`}
            icon={<Icon name="arrow-up" size={3.5} />}
            disabled={!canSubmit}
            onClick={submitComment}
            data-testid="comments-floating-send-button"
          />
        )}
        data-testid="comments-floating-input-section"
      />
    </div>
  )
}
