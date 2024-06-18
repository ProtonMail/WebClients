import { CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListThread } from './CommentsPanelListThread'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCommentsContext } from './CommentsContext'
import debounce from '@proton/utils/debounce'
import { usePopper, usePopperAnchor } from '@proton/components'
import SpeechBubbleNumberIcon from '../../Icons/SpeechBubbleNumberIcon'
import { c } from 'ttag'

const RecalculateThreadPositionsEvent = 'RecalculateThreadPositions'
const dispatchRecalculateEvent = () => {
  document.dispatchEvent(new CustomEvent(RecalculateThreadPositionsEvent))
}
const SixtyFPSToMS = 1000 / 60

function ThreadPopoverButton({ thread }: { thread: CommentThreadInterface }) {
  const { anchorRef, isOpen, toggle } = usePopperAnchor<HTMLButtonElement>()
  const { floating, position } = usePopper({
    isOpen,
    originalPlacement: 'left-start',
    availablePlacements: ['left', 'left-start', 'left-end'],
    reference: {
      mode: 'element',
      value: anchorRef.current,
    },
  })

  return (
    <>
      <button ref={anchorRef} onClick={toggle}>
        <div className="sr-only">{c('Action').t`Show thread`}</div>
        <SpeechBubbleNumberIcon className="h-6 w-6" />
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
          ref={floating}
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
  isViewportLarge,
}: {
  thread: CommentThreadInterface
  position: number | undefined
  isViewportLarge: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  const getThreadRect = useCallback(() => {
    if (!element) {
      return
    }

    const container = editor.getRootElement()?.parentElement
    if (!container) {
      return
    }

    const adjust = () => {
      const child = element.firstElementChild
      if (!child) {
        return
      }

      const previousSibling = element.previousElementSibling
      if (!previousSibling) {
        element.style.opacity = '1'
        return
      }

      const childRect = child.getBoundingClientRect()

      const previousSiblingRect = previousSibling.getBoundingClientRect()

      const containerRect = container.getBoundingClientRect()
      const containerOffset = container.scrollTop - containerRect.top

      const trueChildRectTop = childRect.top + containerOffset
      const truePrevSiblingBottom = previousSiblingRect.bottom + containerOffset

      const position = parseFloat(element.style.getPropertyValue('--initial-position'))
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
  }, [getThreadRect, position])

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

  return (
    <div
      ref={(element) => {
        setElement(element)
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: isViewportLarge ? '50%' : '',
        right: isViewportLarge ? '' : 0,
        transition: 'transform 50ms, opacity 75ms',
        width: isViewportLarge ? 'calc(100% - 2rem)' : '1.5rem',
        opacity: 0,
        '--initial-position': `${position}px`,
        '--final-position': undefined,
        transform: `translate3d(-50%, var(--final-position, var(--initial-position)), 0)`,
      }}
    >
      {isViewportLarge ? <CommentsPanelListThread thread={thread} /> : <ThreadPopoverButton thread={thread} />}
    </div>
  )
}

const ViewportWidthThreshold = 1080

export function ContextualComments({ activeThreads }: { activeThreads: CommentThreadInterface[] }) {
  const [editor] = useLexicalComposerContext()
  const { markNodeMap } = useCommentsContext()
  const [positions, setPositions] = useState(new Map<string, number>())
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [isViewportLarge, setIsViewportLarge] = useState(() => window.innerWidth >= ViewportWidthThreshold)
  useEffect(() => {
    const listener = debounce(() => {
      setIsViewportLarge(window.innerWidth >= ViewportWidthThreshold)
    }, SixtyFPSToMS)

    window.addEventListener('resize', listener)

    return () => {
      window.removeEventListener('resize', listener)
    }
  }, [])

  const getThreadPositions = useCallback(() => {
    const container = editor.getRootElement()?.parentElement
    if (!container) {
      return
    }
    const positionsMap = new Map<string, number>()
    for (const thread of activeThreads) {
      const markID = thread.markID
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys === undefined) {
        continue
      }
      const markNodeKey = Array.from(markNodeKeys)[0]
      const markElement = editor.getElementByKey(markNodeKey)
      if (!markElement) {
        continue
      }
      const markRect = markElement.getBoundingClientRect()
      positionsMap.set(thread.id, markRect.y + container.scrollTop - container.getBoundingClientRect().top)
    }
    setPositions(positionsMap)
  }, [activeThreads, editor, markNodeMap])

  useEffect(() => {
    getThreadPositions()
  }, [getThreadPositions])

  const debouncedGetThreadPositions = useMemo(() => debounce(getThreadPositions, 100), [getThreadPositions])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      debouncedGetThreadPositions()
    })
  }, [debouncedGetThreadPositions, editor])

  const sortedThreads = useMemo(() => {
    return activeThreads.slice().sort((a, b) => {
      const aPosition = positions.get(a.id)
      const bPosition = positions.get(b.id)
      if (aPosition === undefined || bPosition === undefined) {
        return 0
      }
      const areThreadsOnSamePosition = aPosition === bPosition
      if (areThreadsOnSamePosition) {
        return b.createTime.serverTimestamp - a.createTime.serverTimestamp
      }
      return aPosition - bPosition
    })
  }, [activeThreads, positions])

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
      className="relative print:hidden"
      style={{
        gridRow: 1,
        gridColumn: 1,
        justifySelf: 'end',
        width: 'var(--comments-width)',
      }}
    >
      {sortedThreads.map((thread) => {
        return (
          <ContextualThread
            key={thread.id}
            thread={thread}
            position={positions.get(thread.id)}
            isViewportLarge={isViewportLarge}
          />
        )
      })}
    </div>
  )
}
