import { Icon, usePopper, usePopperAnchor } from '@proton/components/components'
import { useCallback, useEffect, useRef, useState } from 'react'
import Pill from './Pill'
import { c } from 'ttag'

const POPOVER_CLOSE_DELAY = 250
const POPOVER_FOCUS_EVENT_NAME = 'popover:focus'
const POPOVER_FOCUS_EVENT = new Event(POPOVER_FOCUS_EVENT_NAME)

const usePopover = () => {
  const { anchorRef, isOpen, toggle } = usePopperAnchor<HTMLButtonElement>()
  const { floating, position } = usePopper({
    isOpen,
    originalPlacement: 'bottom-start',
    availablePlacements: ['bottom', 'bottom-start', 'bottom-end'],
    reference: {
      mode: 'element',
      value: anchorRef.current,
    },
  })

  return {
    isOpen,
    anchorRef,
    floating,
    position,
    toggle,
  }
}

const PopoverPill = ({
  children,
  title,
  content,
  footer,
  onToggle,
}: {
  children: React.ReactNode
  title: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  onToggle?: (isOpen: boolean) => void
}) => {
  const { anchorRef, position, floating, toggle, isOpen } = usePopover()
  const containerRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [updateFlag, setUpdateFlag] = useState<boolean>(false)
  const getIsHovered = () => containerRef.current?.matches(':hover')
  const getIsFocused = () => anchorRef.current?.matches(':focus') || linkRef.current?.matches(':focus')
  const isAnyPopoverFocused = () =>
    document.activeElement && document.activeElement.hasAttribute('data-connection-popover')

  useEffect(() => {
    const handler = () => {
      setUpdateFlag(!updateFlag)
    }
    document.addEventListener(POPOVER_FOCUS_EVENT_NAME, handler)
    return () => {
      document.removeEventListener(POPOVER_FOCUS_EVENT_NAME, handler)
    }
  }, [])

  useEffect(() => {
    const isFocused = getIsFocused()
    const isHovered = getIsHovered()
    const isNotTheActivePopover = isAnyPopoverFocused() && !isFocused
    const shouldBeOpen = isFocused || (isHovered && !isNotTheActivePopover)

    if (onToggle && shouldBeOpen !== undefined) {
      onToggle(shouldBeOpen)
    }

    if (!shouldBeOpen && isOpen) {
      const timeout = setTimeout(() => {
        toggle()
      }, POPOVER_CLOSE_DELAY)

      return () => {
        clearTimeout(timeout)
      }
    }

    if (shouldBeOpen && !isOpen) {
      toggle()
      return
    }
  }, [updateFlag])

  const handleUpdateFlag = useCallback(() => {
    setUpdateFlag(!updateFlag)
  }, [updateFlag, setUpdateFlag])

  let ownFooter = footer || (
    <div className="flex gap-2 py-1 text-[--text-hint]">
      <Icon name="lock-check" />
      <span>
        {c('Info').t`End to end encrypted.`}{' '}
        <a
          data-connection-popover
          ref={linkRef}
          className="underline hover:underline"
          href="https://proton.me/security/end-to-end-encryption"
          target="_blank"
        >
          {c('Info').t`Learn more`}
        </a>
      </span>
    </div>
  )

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleUpdateFlag}
      onMouseLeave={handleUpdateFlag}
      onFocus={() => {
        document.dispatchEvent(POPOVER_FOCUS_EVENT)
        handleUpdateFlag()
      }}
      onBlur={handleUpdateFlag}
      onClick={handleUpdateFlag}
    >
      <Pill data-connection-popover ref={anchorRef}>
        {children}
      </Pill>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            top: 0,
            left: 0,
            transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
          }}
          className="w-[392px] select-text overflow-hidden rounded-lg bg-[--background-norm] shadow"
          ref={floating}
        >
          <div className="flex flex-col gap-4 p-6">
            <span className="text-rg text-bold">{title}</span>
            <span className="text-sm">{content}</span>
          </div>
          <div className="bg-[--primary-minor-2] px-6 py-3 text-xs">{ownFooter}</div>
        </div>
      )}
    </div>
  )
}

export default PopoverPill
