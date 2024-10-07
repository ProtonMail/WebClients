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

const RecalculateThreadPositionsEvent = 'RecalculateThreadPositions'
const dispatchRecalculateEvent = () => {
  document.dispatchEvent(new CustomEvent(RecalculateThreadPositionsEvent))
}
const RecalculateSpecificThreadPositionEvent = 'RecalculateSpecificThread'
const SixtyFPSToMS = 1000 / 60

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

function ContextualThread({
  thread,
  position,
  activePosition,
  isViewportLarge,
}: {
  thread: CommentThreadInterface
  position: number
  activePosition: number
  isViewportLarge: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  const activePositionRef = useRef(activePosition)
  useEffect(() => {
    activePositionRef.current = activePosition
  }, [activePosition])

  const getThreadRect = useCallback(() => {
    if (!element) {
      return
    }

    const container = editor.getRootElement()?.parentElement
    if (!container) {
      return
    }

    const adjust = () => {
      const activePosition = activePositionRef.current
      const child = element.firstElementChild
      if (!child) {
        return
      }

      const position = parseFloat(element.style.getPropertyValue('--initial-position'))

      const previousSibling = element.previousElementSibling

      const isCurrentActivePosition = activePosition === position
      if (isCurrentActivePosition) {
        element.style.opacity = '1'
        element.style.setProperty('--final-position', `${position}px`)
        if (previousSibling) {
          previousSibling.dispatchEvent(new CustomEvent(RecalculateSpecificThreadPositionEvent))
        }
        return
      }

      const childRect = child.getBoundingClientRect()

      const containerRect = container.getBoundingClientRect()
      const containerOffset = container.scrollTop - containerRect.top

      const trueChildRectTop = childRect.top + containerOffset
      const trueChildRectBottom = childRect.bottom + containerOffset

      const isAboveActivePosition = activePosition > position
      if (isAboveActivePosition) {
        const nextSibling = element.nextElementSibling

        if (nextSibling) {
          const nextSiblingRect = nextSibling.getBoundingClientRect()
          const trueNextSiblingTop = nextSiblingRect.top + containerOffset
          const childCollidesWithActivePosition = trueChildRectBottom > activePosition
          const childCollidesWithNextSibling = trueChildRectBottom > trueNextSiblingTop

          if (childCollidesWithActivePosition || childCollidesWithNextSibling) {
            const finalPosition = trueNextSiblingTop - childRect.height - 10
            element.style.setProperty('--final-position', `${finalPosition}px`)
            if (trueChildRectTop !== finalPosition) {
              requestAnimationFrame(adjust)
              if (previousSibling) {
                previousSibling.dispatchEvent(new CustomEvent(RecalculateSpecificThreadPositionEvent))
              }
            }
          }
        }

        return
      }

      if (!previousSibling) {
        if (trueChildRectTop !== position) {
          element.style.setProperty('--final-position', `${position}px`)
        }
        element.style.opacity = '1'
        return
      }

      const previousSiblingRect = previousSibling.getBoundingClientRect()

      const truePrevSiblingBottom = previousSiblingRect.bottom + containerOffset

      let finalPosition = position
      const isChildCollidingWithPreviousThread = trueChildRectTop < truePrevSiblingBottom
      const canUseActualPosition = position && truePrevSiblingBottom < position
      if (isChildCollidingWithPreviousThread || !canUseActualPosition) {
        finalPosition = truePrevSiblingBottom + 10
      }
      if (trueChildRectTop !== finalPosition) {
        element.style.setProperty('--final-position', `${finalPosition}px`)
        requestAnimationFrame(adjust)
        dispatchRecalculateEvent()
      } else {
        element.style.opacity = '1'
      }
    }

    requestAnimationFrame(adjust)
  }, [editor, element])

  useEffect(() => {
    requestAnimationFrame(getThreadRect)
  }, [getThreadRect, position, activePosition])

  useEffect(() => {
    if (!element) {
      return
    }

    const child = element.firstElementChild

    const observer = new ResizeObserver(() => {
      dispatchRecalculateEvent()
    })

    observer.observe(child ?? element)

    return () => {
      observer.disconnect()
    }
  }, [element])

  useEffect(() => {
    const listener = debounce(() => {
      requestAnimationFrame(getThreadRect)
    }, SixtyFPSToMS)

    document.addEventListener(RecalculateThreadPositionsEvent, listener)

    return () => {
      document.removeEventListener(RecalculateThreadPositionsEvent, listener)
    }
  }, [getThreadRect])

  useEffect(() => {
    if (!element) {
      return
    }

    const listener = debounce(() => {
      requestAnimationFrame(getThreadRect)
    }, SixtyFPSToMS)

    element.addEventListener(RecalculateSpecificThreadPositionEvent, listener)

    return () => {
      element.removeEventListener(RecalculateSpecificThreadPositionEvent, listener)
    }
  }, [element, getThreadRect])

  return (
    <div
      ref={(element) => {
        setElement(element)
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: isViewportLarge ? '50%' : undefined,
        right: isViewportLarge ? undefined : 0,
        transition: 'opacity 75ms',
        width: isViewportLarge ? 'calc(100% - 2rem)' : 'auto',
        opacity: 0,
        '--initial-position': `${position}px`,
        '--final-position': undefined,
        '--translate-x': isViewportLarge ? '-50%' : undefined,
        transform: `translate3d(var(--translate-x, 0), var(--final-position, var(--initial-position)), 0)`,
        pointerEvents: 'auto',
      }}
    >
      {isViewportLarge ? <CommentsPanelListThread thread={thread} /> : <ThreadPopoverButton thread={thread} />}
    </div>
  )
}

const ViewportWidthThreshold = 1080

type ThreadWithPosition = {
  thread: CommentThreadInterface
  position: number
}

function sortThreadByPositionOrTime(a: ThreadWithPosition, b: ThreadWithPosition) {
  const aPosition = a.position
  const bPosition = b.position
  if (aPosition === undefined || bPosition === undefined) {
    return 0
  }
  const areThreadsOnSamePosition = aPosition === bPosition
  if (areThreadsOnSamePosition) {
    return b.thread.createTime.serverTimestamp - a.thread.createTime.serverTimestamp
  }
  return aPosition - bPosition
}

export function ContextualComments({ activeThreads }: { activeThreads: CommentThreadInterface[] }) {
  const [editor] = useLexicalComposerContext()
  const { markNodeMap, activeIDs } = useCommentsContext()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [threadsSortedByPosition, setThreadsSortedByPosition] = useState<
    {
      thread: CommentThreadInterface
      position: number
    }[]
  >([])

  const [activePosition, setActivePosition] = useState(0)
  useEffect(() => {
    const id = activeIDs[0]
    if (!id) {
      setActivePosition(0)
      return
    }
    const thread = threadsSortedByPosition.find(({ thread }) => thread.markID === id)
    if (!thread) {
      setActivePosition(0)
      return
    }
    setActivePosition(thread.position)
  }, [activeIDs, threadsSortedByPosition])

  const [isViewportLarge, setIsViewportLarge] = useState(() => window.innerWidth >= ViewportWidthThreshold)

  const getThreadPositions = useCallback(() => {
    const container = editor.getRootElement()?.parentElement
    if (!container) {
      return
    }
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

    const threadsSortedByPosition = (
      activeThreads
        .map((thread) => {
          const markRect = getMarkRectForThread(thread)
          if (!markRect) {
            return null
          }
          return {
            thread: thread,
            position: markRect.y + container.scrollTop - container.getBoundingClientRect().top,
          }
        })
        .filter((thread) => thread) as ThreadWithPosition[]
    ).sort(sortThreadByPositionOrTime)

    setThreadsSortedByPosition(threadsSortedByPosition)
  }, [activeThreads, editor, markNodeMap])

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
    <div
      ref={setContainer}
      className="pointer-events-none relative print:hidden"
      style={{
        gridRow: 1,
        gridColumn: 1,
        justifySelf: 'end',
        width: isViewportLarge ? 'var(--comments-width)' : 'max-content',
      }}
    >
      {threadsSortedByPosition.map((thread, index) => {
        const prevThreadPosition = threadsSortedByPosition[index - 1]?.position
        const threadPosition = thread.position
        const hasSamePositionAsPrev = prevThreadPosition === threadPosition
        return (
          <ContextualThread
            key={thread.thread.id}
            thread={thread.thread}
            position={hasSamePositionAsPrev ? threadPosition + 1 : threadPosition}
            activePosition={activePosition}
            isViewportLarge={isViewportLarge}
          />
        )
      })}
    </div>
  )
}
