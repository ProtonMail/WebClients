import type { ComponentPropsWithoutRef, ForwardedRef, ReactNode, RefObject } from 'react'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import debounce from '@proton/utils/debounce'
import { mergeRefs } from '../../Shared/mergeRefs'
import clsx from '@proton/utils/clsx'

export type PositionedItem = {
  id: string
  item: ReactNode
  itemProps?: ComponentPropsWithoutRef<'div'>
  position: number
}

/**
 * Wrapper element that contains the actual item.
 * Used to position the item and watch for size changes
 * without needing to attach events or change anything on
 * the item.
 * Not meant to be used directly.
 */
function PositionedChild({
  item,
  onHandleResize,
  className,
  style,
  ...rest
}: { item: PositionedItem; onHandleResize: () => void } & PositionedItem['itemProps']) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!element) {
      return
    }

    const observer = new ResizeObserver(() => onHandleResize())
    observer.observe(element)

    onHandleResize()

    return () => {
      observer.disconnect()
    }
  }, [element, onHandleResize])

  return (
    <div
      ref={(element) => {
        setElement(element)
      }}
      data-id={item.id}
      data-position={item.position}
      className={clsx('transition-transform duration-[250] motion-reduce:duration-0', className)}
      style={{
        position: 'absolute',
        top: 0,
        '--initial-position': `${item.position}px`,
        '--translate-x': '0',
        transform: `translate3d(var(--translate-x, 0), var(--position, var(--initial-position, 0)), 0)`,
        ...style,
      }}
      {...rest}
    >
      {item.item}
    </div>
  )
}

/**
 * Positions the given items at the given positions while
 * making sure none of them collide, even when one of them
 * dynamically resizes.
 * If an active item ID is given, it will focus it by making
 * sure it is at its original positon, while other items move
 * around it.
 */
export const Positioner = forwardRef(function Positioner(
  {
    activeItemID,
    items,
    scrollContainer,
    gap = 10,
    positionUpdateDebounceTimeout,
    ...rest
  }: {
    /** ID of the item to focus */
    activeItemID: string | undefined
    items: PositionedItem[]
    /**
     * Scrollable parent element that is used to calculate an offset that
     * positions the items correctly when scrolled.
     */
    scrollContainer?: HTMLElement | null | RefObject<HTMLElement | null>
    /** Minimum gap between items */
    gap?: number
    /** NOTE: For tests only */
    positionUpdateDebounceTimeout?: number
  } & ComponentPropsWithoutRef<'div'>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const resolvedScrollContainer = useMemo(() => {
    if (!scrollContainer) {
      return null
    }
    if ('current' in scrollContainer) {
      return scrollContainer.current
    } else {
      return scrollContainer
    }
  }, [scrollContainer])

  const scrollContainerRect = useMemo(() => resolvedScrollContainer?.getBoundingClientRect(), [resolvedScrollContainer])

  const getScrollContainerOffset = useCallback(() => {
    if (!resolvedScrollContainer) {
      return 0
    }
    return resolvedScrollContainer.scrollTop - scrollContainerRect!.top
  }, [resolvedScrollContainer, scrollContainerRect])

  const sortedAndAdjustedItems = useMemo(() => {
    const containerOffset = getScrollContainerOffset()
    return items
      .map((item) => ({ ...item, position: item.position + containerOffset }))
      .sort((a, b) => {
        return a.position - b.position
      })
  }, [getScrollContainerOffset, items])

  const [element, setElement] = useState<HTMLElement | null>(null)

  const updateChildrenPosition = useCallback(() => {
    if (!element) {
      return
    }

    const children = Array.from(element.children)

    // We create an initial array containing the original positions and the heights
    // of the elements. The `position`s are later updated to take into account
    // any collisions so they can be adjusted accordingly.
    const positionsMap = children.map((child) => {
      const positionAttribute = child.getAttribute('data-position')
      if (!positionAttribute) {
        throw new Error('Expected child to have position attribute')
      }
      return {
        id: child.getAttribute('data-id'),
        position: parseFloat(positionAttribute),
        height: child.clientHeight,
      }
    })

    const activeIndex = positionsMap.findIndex((child) => child.id === activeItemID)

    const activeItem = positionsMap[activeIndex]
    const itemBeforeActiveItem = positionsMap[activeIndex - 1]

    // If the item above the active item will collide with the active item,
    // we need to process the items above the active item in reverse order in a separate loop
    let needToAdjustItemsAboveActiveSeparately = false
    if (activeItem && itemBeforeActiveItem) {
      const currentBottomPosition = itemBeforeActiveItem.position + itemBeforeActiveItem.height
      const activeItemPosition = activeItem.position
      const willCollideWithNextItem = currentBottomPosition > activeItemPosition
      if (willCollideWithNextItem) {
        needToAdjustItemsAboveActiveSeparately = true
      }
    }

    // If there is an active index, we process all the items after it, otherwise
    // we start from the beginning.
    const startingIndex = needToAdjustItemsAboveActiveSeparately ? activeIndex + 1 : 0
    for (let i = startingIndex; i < children.length; i++) {
      const item = positionsMap[i]
      if (!item) {
        continue
      }
      const prevItem = positionsMap[i - 1]
      if (!prevItem) {
        // Item is the first child
        continue
      }
      // If the bottom position of the previous item is more than the
      // position of the current, it means it will collide with the current.
      // In that case we place the current item below the previous item with
      // a predefined gap.
      const prevItemBottomPosition = prevItem.position + prevItem.height
      const willPrevItemCollide = prevItemBottomPosition > item.position
      if (willPrevItemCollide) {
        const newPosition = prevItemBottomPosition + gap
        item.position = newPosition
      }
    }

    if (needToAdjustItemsAboveActiveSeparately) {
      // We need to process all items before the active index in reverse order
      for (let i = activeIndex - 1; i >= 0; i--) {
        const item = positionsMap[i]
        if (!item) {
          continue
        }
        const nextItem = positionsMap[i + 1]
        if (!nextItem) {
          continue
        }
        const currentBottomPosition = item.position + item.height
        const nextItemPosition = nextItem.position
        const willCollideWithNextItem = currentBottomPosition > nextItemPosition
        if (willCollideWithNextItem) {
          const newPosition = nextItemPosition - gap - item.height
          item.position = newPosition
        }
      }
    }

    // Finally we apply the position to the actual elements
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement
      const position = positionsMap[i].position
      child.style.setProperty('--position', `${position}px`)
    }
  }, [activeItemID, element, gap])

  const debouncedUpdatePositions = useMemo(
    () => debounce(updateChildrenPosition, positionUpdateDebounceTimeout ?? 50),
    [positionUpdateDebounceTimeout, updateChildrenPosition],
  )

  return (
    <div ref={mergeRefs(setElement, forwardedRef)} {...rest}>
      {sortedAndAdjustedItems.map((item) => (
        <PositionedChild item={item} key={item.id} onHandleResize={debouncedUpdatePositions} {...item.itemProps} />
      ))}
    </div>
  )
})
