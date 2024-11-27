import type { CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListThread } from './CommentsPanelListThread'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCommentsContext } from './CommentsContext'
import debounce from '@proton/utils/debounce'
import { usePopper, usePopperAnchor } from '@proton/components'
import SpeechBubbleDotsIcon from '../../Icons/SpeechBubbleDotsIcon'
import { c } from 'ttag'
import useCombinedRefs from '@proton/hooks/useCombinedRefs'
import type { PositionedItem } from './Positioner'
import { Positioner } from './Positioner'
import { CommentInputBox } from './CommentInputBox'

const RecalculateThreadPositionsEvent = 'RecalculateThreadPositions'
const dispatchRecalculateEvent = () => {
  document.dispatchEvent(new CustomEvent(RecalculateThreadPositionsEvent))
}
const SixtyFPSToMS = 1000 / 60

const CommentInputID = 'comment-input'

function ThreadPopoverButton({ thread }: { thread: CommentThreadInterface }) {
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const { floating, position } = usePopper({
    isOpen,
    originalPlacement: 'left-start',
    availablePlacements: ['left', 'left-start', 'left-end'],
    reference: {
      mode: 'element',
      value: anchorRef.current,
    },
  })

  const combinedRef = useCombinedRefs<HTMLDivElement>(popoverRef, floating)

  useEffect(() => {
    const handleClickOutside = ({ target }: MouseEvent) => {
      const targetNode = target as HTMLElement
      if (popoverRef.current?.contains(targetNode) || anchorRef.current?.contains(targetNode)) {
        return
      }
      close()
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [anchorRef, close])

  return (
    <>
      <button className="bg-norm border-weak rounded border p-2" ref={anchorRef} onClick={toggle}>
        <div className="sr-only">{c('Action').t`Show thread`}</div>
        <SpeechBubbleDotsIcon className="min-h-4 min-w-4" />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
            width: 'var(--comments-width)',
          }}
          ref={combinedRef}
        >
          <CommentsPanelListThread thread={thread} />
        </div>
      )}
    </>
  )
}

const ViewportWidthThreshold = 1080

function ThreadComponent({ thread, isViewportLarge }: { thread: CommentThreadInterface; isViewportLarge: boolean }) {
  if (isViewportLarge) {
    return (
      <CommentsPanelListThread thread={thread} className="hover:translate-x-[-5px] data-[active]:translate-x-[-5px]" />
    )
  }

  return <ThreadPopoverButton thread={thread} />
}

export function ContextualComments({ activeThreads }: { activeThreads: CommentThreadInterface[] }) {
  const [editor] = useLexicalComposerContext()
  const { markNodeMap, activeIDs, commentInputPosition, cancelAddComment } = useCommentsContext()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [items, setItems] = useState<PositionedItem[]>([])

  const activeMarkID = activeIDs[0] as string | undefined

  const activeThread = useMemo(() => {
    if (!activeMarkID) {
      return undefined
    }

    return activeThreads.find((thread) => thread.markID === activeMarkID)
  }, [activeMarkID, activeThreads])

  const [isViewportLarge, setIsViewportLarge] = useState(() => window.innerWidth >= ViewportWidthThreshold)

  const getThreadPositions = useCallback(() => {
    const getMarkRectForThread = (thread: CommentThreadInterface) => {
      const markID = thread.markID
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys === undefined) {
        return null
      }
      const markNodeKey = Array.from(markNodeKeys)[0]
      const markElement = editor.getElementByKey(markNodeKey)
      if (!markElement) {
        return null
      }
      const markRect = markElement.getBoundingClientRect()
      return markRect
    }

    const activeThreadItems: PositionedItem[] = activeThreads
      .sort((a, b) => a.createTime.serverTimestamp - b.createTime.serverTimestamp)
      .map((thread) => {
        const markRect = getMarkRectForThread(thread)
        if (!markRect) {
          return null
        }
        return {
          id: thread.id,
          item: <ThreadComponent thread={thread} isViewportLarge={isViewportLarge} />,
          itemProps: {
            style: {
              left: isViewportLarge ? '50%' : undefined,
              right: isViewportLarge ? undefined : 0,
              width: isViewportLarge ? 'calc(100% - 2rem)' : 'auto',
              '--translate-x': isViewportLarge ? '-50%' : undefined,
            },
          },
          position: markRect.y,
        } satisfies PositionedItem
      })
      .filter((thread) => !!thread)

    if (commentInputPosition !== undefined) {
      const commentInputItem: PositionedItem[] = [
        {
          id: CommentInputID,
          item: <CommentInputBox editor={editor} cancelAddComment={cancelAddComment} />,
          itemProps: {
            style: {
              width: 'calc(100% - 2rem)',
            },
          },
          position: commentInputPosition,
        },
      ]
      setItems(commentInputItem.concat(activeThreadItems))
    } else {
      setItems(activeThreadItems)
    }
  }, [activeThreads, cancelAddComment, commentInputPosition, editor, isViewportLarge, markNodeMap])

  const debouncedGetThreadPositions = useMemo(() => debounce(getThreadPositions, 50), [getThreadPositions])

  useEffect(() => {
    debouncedGetThreadPositions()
  }, [debouncedGetThreadPositions])

  useEffect(() => {
    const listener = debounce(() => {
      setIsViewportLarge(window.innerWidth >= ViewportWidthThreshold)
      debouncedGetThreadPositions()
    }, SixtyFPSToMS)

    window.addEventListener('resize', listener)

    return () => {
      window.removeEventListener('resize', listener)
    }
  }, [debouncedGetThreadPositions])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      debouncedGetThreadPositions()
    })
  }, [debouncedGetThreadPositions, editor])

  const debouncedDispatchRecalculateEvent = useMemo(() => debounce(dispatchRecalculateEvent, SixtyFPSToMS), [])
  useEffect(() => {
    const containerParent = container?.parentElement

    if (!containerParent) {
      return
    }

    containerParent.addEventListener('scroll', debouncedDispatchRecalculateEvent)

    return () => {
      containerParent.removeEventListener('scroll', debouncedDispatchRecalculateEvent)
    }
  }, [container, debouncedDispatchRecalculateEvent])

  return (
    <Positioner
      ref={setContainer}
      activeItemID={commentInputPosition !== undefined ? CommentInputID : activeThread?.id}
      items={items}
      className="pointer-events-none relative *:pointer-events-auto print:hidden"
      style={{
        gridRow: 1,
        gridColumn: 1,
        justifySelf: 'end',
        width: isViewportLarge ? 'var(--comments-width)' : 'max-content',
      }}
      scrollContainer={editor.getRootElement()?.parentElement}
    />
  )
}
