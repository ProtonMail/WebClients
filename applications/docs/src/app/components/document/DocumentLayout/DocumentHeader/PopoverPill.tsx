import { useEffect } from 'react'
import { Pill } from './Pill'
import * as Ariakit from '@ariakit/react'

const POPOVER_OPEN_DELAY = 250
const POPOVER_CLOSE_DELAY = 250

export type PopoverPillProps = {
  children: React.ReactNode
  title: React.ReactNode
  content: React.ReactNode
  onToggle?: (isOpen: boolean) => void
  placement?: Ariakit.HovercardProviderProps['placement']
}

export function PopoverPill({ children, title, content, onToggle, placement = 'bottom-start' }: PopoverPillProps) {
  const store = Ariakit.useHovercardStore({
    placement,
    showTimeout: POPOVER_OPEN_DELAY,
    hideTimeout: POPOVER_CLOSE_DELAY,
    setOpen: (open) => {
      if (onToggle) {
        onToggle(open)
      }
    },
  })
  const mounted = Ariakit.useStoreState(store, (s) => s.mounted)

  useEffect(() => {
    if (!mounted) {
      return
    }

    const controller = new AbortController()
    /**
     * Ariakit doesn't correctly close the hovercard if you move the mouse over
     * the iframe, so we manually close it when the mouse is over the iframe,
     * but only if the focus is not in the hovercard.
     */
    window.addEventListener(
      'mouseover',
      (event) => {
        const hovercardElement = store.getState().contentElement
        if (event.target instanceof HTMLIFrameElement && !hovercardElement?.contains(document.activeElement)) {
          store.hide()
        }
      },
      { signal: controller.signal },
    )
    // The `dropdownclose` event gets fired any time the iframe gets focus.
    document.addEventListener(
      'dropdownclose',
      () => {
        store.hide()
      },
      { signal: controller.signal },
    )
    return () => controller.abort()
  }, [store, mounted])

  return (
    <Ariakit.HovercardProvider store={store}>
      <Ariakit.HovercardAnchor render={<Pill data-connection-popover>{children}</Pill>}></Ariakit.HovercardAnchor>
      <Ariakit.Hovercard
        portal
        gutter={10}
        className="bg-norm border-norm shadow-lifted w-[392px] select-text overflow-hidden rounded-lg border"
      >
        <div className="flex flex-col gap-4 p-6">
          <span className="text-rg text-bold">{title}</span>
          <span>{content}</span>
        </div>
      </Ariakit.Hovercard>
    </Ariakit.HovercardProvider>
  )
}
