import { cloneElement, type ComponentPropsWithRef, forwardRef, isValidElement, type ReactNode } from 'react'
import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/icons'
import clsx from '@proton/utils/clsx'
import { Icon } from '@proton/components'

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  formulaBarSlot?: ReactNode
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { formulaBarSlot, ...props }: ContainerProps,
  ref,
) {
  return (
    <div ref={ref} {...props} className={clsx('bg-[#F9FBFC] px-4 pb-3', props.className)}>
      <Ariakit.Toolbar className="border-weak flex min-h-[5.5rem] max-w-[104.5rem] items-center gap-[.875rem] rounded-t-[1rem] border bg-[white] px-3 py-[.375rem]">
        {props.children}
      </Ariakit.Toolbar>
      {formulaBarSlot}
    </div>
  )
})

export interface GroupProps extends ComponentPropsWithRef<'div'> {}

export const Group = forwardRef<HTMLDivElement, GroupProps>(function Group({ children, ...props }: GroupProps, ref) {
  return (
    <div ref={ref} {...props} className={clsx('flex flex-col justify-center', props.className)}>
      {children}
    </div>
  )
})

export interface RowProps extends ComponentPropsWithRef<'div'> {}

export const Row = forwardRef<HTMLDivElement, RowProps>(function Row({ children, ...props }: RowProps, ref) {
  return (
    <div ref={ref} {...props} className={clsx('flex flex-row items-center gap-2', props.className)}>
      {children}
    </div>
  )
})

export interface ItemOptions {
  /**
   * @default 'half'
   */
  size?: 'half' | 'full'
  icon: IconName
}

export interface ItemProps extends ItemOptions, Ariakit.ToolbarItemProps {
  children: string
}

export const Item = forwardRef<HTMLButtonElement, ItemProps>(function Item(
  { size = 'half', icon, children, ...props }: ItemProps,
  ref,
) {
  const sharedClasses = 'hover:bg-[#C2C1C0]/20 rounded-[.5rem] text-[#000] [&[disabled]]:text-[#8F8D8A]'
  const iconElement = <Icon className="text-[#0C0C14] [[disabled]_&]:text-[#8F8D8A]" name={icon} />

  // half size
  if (size === 'half') {
    return (
      <Ariakit.ToolbarItem
        aria-label={children}
        ref={ref}
        {...props}
        className={clsx('flex h-9 w-9 items-center justify-center', sharedClasses, props.className)}
      >
        {iconElement}
      </Ariakit.ToolbarItem>
    )
  }

  // full size
  return (
    <Ariakit.ToolbarItem
      ref={ref}
      {...props}
      className={clsx(
        'flex h-[4.5rem] flex-col items-center justify-between p-[.625rem]',
        sharedClasses,
        props.className,
      )}
    >
      {iconElement}
      <span className="text-[.75rem]">{children}</span>
    </Ariakit.ToolbarItem>
  )
})

export interface SeparatorProps extends Ariakit.ToolbarSeparatorProps {}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(props, ref) {
  return (
    <Ariakit.ToolbarSeparator
      ref={ref}
      {...props}
      className={clsx('border-weak h-[3.75rem] w-[1px] border-l', props.className)}
    />
  )
})

function MenuPopover(props: Ariakit.MenuProps) {
  return (
    <Ariakit.Menu
      portal
      gutter={4}
      {...props}
      className={clsx(
        'border-weak z-50 max-h-[--popover-available-height] min-w-[10.25rem] overflow-auto overscroll-contain rounded-[.5rem] border bg-[white] py-2 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)]',
        props.className,
      )}
    />
  )
}

export interface MenuProps extends Ariakit.MenuProviderProps {
  menuButtonProps?: Ariakit.MenuButtonProps
  renderMenuButton?: Ariakit.MenuButtonProps['render']
  menuProps?: Ariakit.MenuProps
}

export function Menu({ menuButtonProps, renderMenuButton, menuProps, children, ...props }: MenuProps) {
  const menu = Ariakit.useMenuStore()
  return (
    <Ariakit.MenuProvider {...props} store={menu}>
      <Ariakit.MenuButton {...menuButtonProps} render={renderMenuButton} />
      <MenuPopover {...menuProps}>{children}</MenuPopover>
    </Ariakit.MenuProvider>
  )
}

export interface MenuItemProps extends Ariakit.MenuItemProps {
  isSubmenuTrigger?: boolean
}

export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { isSubmenuTrigger, children, ...props },
  ref,
) {
  return (
    <Ariakit.MenuItem
      ref={ref}
      {...props}
      className={clsx(
        'flex h-9 select-none items-center px-4 text-[.875rem] text-[#0C0C14] hover:bg-[#C2C1C0]/20',
        props.className,
      )}
    >
      <span className="grow">{children}</span>
      {isSubmenuTrigger && <Icon name="chevron-right-filled" className="text-[#0C0C14]" />}
    </Ariakit.MenuItem>
  )
})

export interface MenuSeparatorProps extends Ariakit.MenuSeparatorProps {}

export const MenuSeparator = forwardRef<HTMLHRElement, MenuSeparatorProps>(function MenuSeparator(props, ref) {
  return (
    <Ariakit.MenuSeparator
      ref={ref}
      {...props}
      className={clsx('border-weak my-[.4375rem] h-px border-t', props.className)}
    />
  )
})

export interface SubMenuProps extends Ariakit.MenuProviderProps {
  menuButtonProps?: Ariakit.MenuButtonProps
  renderMenuItem: NonNullable<Ariakit.MenuProps['render']>
  menuProps?: Ariakit.MenuProps
}

export function SubMenu({ menuButtonProps, renderMenuItem, menuProps, children, ...props }: SubMenuProps) {
  if (!isValidElement<MenuItemProps>(renderMenuItem) || renderMenuItem.type !== MenuItem) {
    throw new Error('renderMenuItem must be a <MenuItem /> element')
  }
  const menuItemAsSubmenuTrigger = cloneElement(renderMenuItem, { isSubmenuTrigger: true })
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton {...menuButtonProps} render={menuItemAsSubmenuTrigger} />
      <MenuPopover {...menuProps}>{children}</MenuPopover>
    </Ariakit.MenuProvider>
  )
}
