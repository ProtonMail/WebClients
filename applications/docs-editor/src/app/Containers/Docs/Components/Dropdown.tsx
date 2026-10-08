import * as Ariakit from '@ariakit/react'
import { Button } from '@proton/atoms/Button/Button'
import { clsx } from 'clsx'
import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, ReactNode, RefObject } from 'react'
import { createContext, forwardRef, useContext, useEffect, useRef } from 'react'
import { Icon } from './Icon'
import * as Icons from './icons'

// Mirror Sheets styling, with menus above the Docs comments sidebar (z-30).
const popoverClassName =
  'z-40 max-h-[--popover-available-height] max-w-[--popover-available-width] overflow-auto overscroll-contain rounded-[.5rem] border border-[--border-weak] bg-[--background-norm] py-2 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] focus:outline-none'

const AutoCloseContext = createContext(true)

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  anchorRef: RefObject<HTMLElement>
  children: ReactNode
  isOpen?: boolean
  onClose?: () => void
  onClosed?: () => void
  autoFocusOnHide?: boolean
  originalPlacement?: Ariakit.MenuStoreProps['placement']
  offset?: number
  autoClose?: boolean
  disableFocusTrap?: boolean
  contentProps?: HTMLAttributes<HTMLDivElement>
}

type DropdownContentProps = Omit<DropdownProps, 'anchorRef' | 'isOpen' | 'onClose' | 'originalPlacement'> & {
  store: Ariakit.MenuStore
}

function DropdownContent({
  store,
  children,
  onClosed,
  autoFocusOnHide = true,
  offset = 4,
  autoClose = true,
  disableFocusTrap = false,
  contentProps,
  className,
  style,
  onClick,
  ...props
}: DropdownContentProps) {
  const open = Ariakit.useStoreState(store, 'open')
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open) {
      onClosed?.()
    }
    wasOpen.current = open
  }, [open, onClosed])

  return (
    <AutoCloseContext.Provider value={autoClose}>
      <Ariakit.Menu
        store={store}
        data-testid="dropdown-button"
        portal
        gutter={offset}
        // Menus dismiss on outside interaction without blocking other toolbar controls.
        modal={false}
        unmountOnHide
        autoFocusOnShow={!disableFocusTrap}
        // Return focus to the trigger unless the consumer manages focus on close.
        autoFocusOnHide={autoFocusOnHide}
        // Table selection updates restore editor focus while these menus stay open.
        hideOnInteractOutside={(event) => !disableFocusTrap || event.type !== 'focusin'}
        {...props}
        className={clsx(popoverClassName, className)}
        style={style}
        onClick={(event) => {
          onClick?.(event)
          const target = event.target
          if (!(target instanceof Element) || event.defaultPrevented || !autoClose) {
            return
          }
          // Menu items manage closing (including their parent menus) through Ariakit.
          // Custom controls such as the colour palette also close on pointer selection,
          // while keyboard navigation between radio colours leaves the palette open.
          if (target.closest('[role="menuitem"], [aria-haspopup="menu"]')) {
            return
          }
          if (target instanceof HTMLInputElement && target.type === 'radio' && !event.clientX && !event.clientY) {
            return
          }
          store.hideAll()
        }}
      >
        <div {...contentProps}>{children}</div>
      </Ariakit.Menu>
    </AutoCloseContext.Provider>
  )
}

export function Dropdown({
  anchorRef,
  isOpen = false,
  onClose,
  originalPlacement = 'bottom',
  ...props
}: DropdownProps) {
  const store = Ariakit.useMenuStore({
    open: isOpen,
    setOpen: (open) => {
      if (!open) {
        onClose?.()
      }
    },
    placement: originalPlacement,
  })
  useEffect(() => {
    store.setAnchorElement(anchorRef.current)
    store.setDisclosureElement(anchorRef.current)
  }, [store, anchorRef, isOpen])

  return (
    <Ariakit.MenuProvider store={store}>
      <DropdownContent store={store} {...props} />
    </Ariakit.MenuProvider>
  )
}

export interface DropdownButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'color'> {
  as?: ElementType
  hasCaret?: boolean
  isOpen?: boolean
  caretClassName?: string
  // Presentation props are forwarded when rendering an existing Docs button.
  shape?: 'ghost' | 'solid' | 'outline'
  color?: string
  size?: 'small' | 'medium' | 'large'
  icon?: boolean
  active?: boolean
  label?: ReactNode
}

export const DropdownButton = forwardRef<HTMLButtonElement, DropdownButtonProps>(function DropdownButton(
  {
    as: Component = Button,
    hasCaret = false,
    isOpen,
    caretClassName,
    children,
    className,
    shape,
    color,
    size,
    icon,
    active,
    label,
    ...props
  },
  ref,
) {
  const presentationProps = Component === 'button' ? {} : { shape, color, size, icon, active, label }
  return (
    <Component
      ref={ref}
      type="button"
      data-testid="dropdown-button"
      aria-expanded={isOpen}
      {...presentationProps}
      {...props}
      className={clsx('text-nowrap', hasCaret && 'flex flex-nowrap items-center', className)}
    >
      {children}
      {hasCaret && (
        <Icon data={Icons.chevronDownFilled} className={clsx('shrink-0', children && 'ml-1', caretClassName)} />
      )}
    </Component>
  )
})

export function DropdownMenu({ children, className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} className={clsx('my-0 flex flex-col', className)}>
      {children}
    </div>
  )
}

export interface DropdownMenuButtonProps extends Ariakit.MenuItemProps {
  isSelected?: boolean
  actionType?: 'delete'
}

export const DropdownMenuButton = forwardRef<HTMLButtonElement, DropdownMenuButtonProps>(function DropdownMenuButton(
  { className, isSelected, actionType, hideOnClick, ...props },
  ref,
) {
  const autoClose = useContext(AutoCloseContext)
  return (
    <Ariakit.MenuItem
      render={
        <button ref={ref} type="button">
          {props.children}
        </button>
      }
      hideOnClick={hideOnClick ?? autoClose}
      {...props}
      className={clsx(
        'flex min-h-9 w-full select-none items-center gap-2 px-4 py-2 text-left text-[.875rem] text-[--text-norm] hover:bg-[--interaction-weak-minor-2] focus:outline-none disabled:text-[--text-hint] aria-disabled:text-[--text-hint] data-[active-item]:bg-[--interaction-weak-minor-2] data-[focus-visible]:bg-[--interaction-weak-minor-2]',
        isSelected && 'active font-bold',
        actionType === 'delete' && 'text-[--signal-danger]',
        className,
      )}
    />
  )
})

export interface SimpleDropdownProps extends Omit<DropdownButtonProps, 'content'> {
  content?: ReactNode
  contentProps?: Partial<Omit<DropdownProps, 'anchorRef'>>
  originalPlacement?: DropdownProps['originalPlacement']
  autoClose?: boolean
  onToggle?: (open: boolean) => void
}

export const SimpleDropdown = forwardRef<HTMLButtonElement, SimpleDropdownProps>(function SimpleDropdown(
  { content, children, contentProps, originalPlacement, autoClose, onToggle, hasCaret = true, as, ...props },
  ref,
) {
  const parent = Ariakit.useMenuContext()
  const store = Ariakit.useMenuStore({
    placement: contentProps?.originalPlacement ?? originalPlacement ?? (parent ? 'right-start' : 'bottom'),
    setOpen: onToggle,
  })
  const open = Ariakit.useStoreState(store, 'open')
  const { originalPlacement: _placement, ...menuProps } = contentProps ?? {}
  const ButtonComponent = as ?? Button

  return (
    <Ariakit.MenuProvider store={store}>
      <Ariakit.MenuButton
        store={store}
        ref={ref}
        render={
          <DropdownButton
            {...props}
            as={ButtonComponent}
            isOpen={open}
            hasCaret={hasCaret}
            {...(ButtonComponent === DropdownMenuButton ? { store: parent, hideOnClick: false } : {})}
          >
            {content}
          </DropdownButton>
        }
      />
      <DropdownContent store={store} autoClose={autoClose} {...menuProps}>
        {children}
      </DropdownContent>
    </Ariakit.MenuProvider>
  )
})
