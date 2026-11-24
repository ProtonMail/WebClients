import { useEffect, type RefObject } from 'react'

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getTabbableElements(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)].filter(
    (element) => element.getClientRects().length > 0,
  )
}

/**
 * The parts of Proton's `useFocusTrap` its `Sidebar` relies on: while `active`, the root takes the focus, Tab and
 * Shift+Tab cycle within it, and on release the focus goes back where it was, unless a pointer closed it.
 *
 * Unlike Proton's, it doesn't pull back the focus that leaves the root, which would fight the menus and dialogs the
 * host's widgets in the drawer (the user dropdown) open outside of it, as Proton's trap only spares its own.
 */
export function useDrawerFocusTrap(rootRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const root = rootRef.current
    if (!active || !root) {
      return
    }

    const previouslyFocused = document.activeElement
    let lastInteractionIsPointer = false
    const onPointerDown = () => {
      lastInteractionIsPointer = true
    }
    const onDocumentKeyDown = () => {
      lastInteractionIsPointer = false
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }
      const tabbable = getTabbableElements(root)
      if (tabbable.length === 0) {
        event.preventDefault()
        return
      }
      const first = tabbable[0]
      const last = tabbable[tabbable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    root.focus({ preventScroll: true })
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onDocumentKeyDown, true)
    root.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onDocumentKeyDown, true)
      root.removeEventListener('keydown', onKeyDown)
      const focusIsLost = document.activeElement === document.body || root.contains(document.activeElement)
      if (!lastInteractionIsPointer && focusIsLost && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [active, rootRef])
}
