import type { LexicalEditor, NodeKey } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { c } from 'ttag'
import AddCommentIcon from '../../Icons/AddCommentIcon'
import ToolbarTooltip from '../../Toolbar/ToolbarTooltip'
import { ShortcutLabel } from '../KeyboardShortcuts/ShortcutLabel'
import SpeechBubblePenIcon from '../../Icons/SpeechBubblePenIcon'
import { useApplication } from '../../ApplicationProvider'
import { TOGGLE_SUGGESTION_MODE_COMMAND } from '../Suggestions/Commands'

export function FloatingQuickActions({
  anchorKey,
  editor,
  onAddComment,
}: {
  anchorKey: NodeKey
  editor: LexicalEditor
  onAddComment: () => void
}): JSX.Element {
  const { isSuggestionMode, isSuggestionsFeatureEnabled } = useApplication()

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
      boxElem.style.left = `${right - (paddingRight / 2 || 0)}px`
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

  const addCommentLabel = c('Action').t`Add comment`

  const suggestionToggleLabel = isSuggestionMode ? c('Action').t`Exit Suggestion` : c('Action').t`Suggestion Mode`

  return (
    <div
      className="shadow-raised border-weak bg-norm absolute z-10 flex flex-col gap-1 rounded-lg border p-1"
      ref={boxRef}
    >
      <ToolbarTooltip
        originalPlacement="right"
        title={<ShortcutLabel label={addCommentLabel} shortcut="INSERT_COMMENT_SHORTCUT" />}
      >
        <button
          aria-label={addCommentLabel}
          className="flex cursor-pointer items-center justify-center rounded-lg border-0 bg-none p-2.5 hover:bg-[--background-weak]"
          onClick={onAddComment}
          data-testid="floating-add-comment-button"
        >
          <AddCommentIcon className="h-4 w-4 fill-current" />
        </button>
      </ToolbarTooltip>
      {isSuggestionsFeatureEnabled && (
        <>
          <hr className="min-h-px bg-[--border-weak]" />
          <ToolbarTooltip
            originalPlacement="right"
            title={<ShortcutLabel label={suggestionToggleLabel} shortcut="SUGGESTION_MODE_SHORTCUT" />}
          >
            <button
              aria-label={suggestionToggleLabel}
              className="flex cursor-pointer items-center justify-center rounded-lg border-0 bg-none p-2.5 hover:bg-[--background-weak]"
              onClick={() => {
                editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined)
              }}
              data-testid="floating-add-comment-button"
            >
              <SpeechBubblePenIcon className="h-4 w-4 fill-current" />
            </button>
          </ToolbarTooltip>
        </>
      )}
    </div>
  )
}
