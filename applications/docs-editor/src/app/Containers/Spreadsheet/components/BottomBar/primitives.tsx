import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { type ComponentPropsWithoutRef, type ReactNode, type Ref, forwardRef } from 'react'
import { IcCrossSmall, IcPlus, IcHamburger } from '@proton/icons'
import { createComponent } from '../utils'

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(props: ContainerProps, ref) {
  return (
    <div ref={ref} {...props} className={clsx('border-t border-[#DEDEDE] bg-[#F9FBFC]', props.className)}>
      <Ariakit.Toolbar className="flex h-10 items-center">{props.children}</Ariakit.Toolbar>
    </div>
  )
})

export interface TabItemProps {
  ref?: Ref<HTMLDivElement>
  active?: boolean
  children?: ReactNode
  onClose?: () => void
  color?: string
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  draggable?: boolean
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
  onDoubleClick?: () => void
}

export const TabItem = createComponent<TabItemProps>(function TabItem({
  active,
  children,
  onClose,
  color,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggable,
  style,
  className,
  onClick,
  onDoubleClick,
}: TabItemProps) {
  return (
    <Ariakit.ToolbarItem
      render={
        <div
          role="button"
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          draggable={draggable}
          style={style}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick?.()
            }
          }}
        />
      }
      tabIndex={0}
      role="tab"
      className={clsx(
        'relative mb-[4px] flex h-[26px] min-w-[115px] cursor-pointer items-center gap-2 rounded-[6px] px-8 text-[.875rem] transition-colors',
        'hover:bg-[#EDEDED]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4695F3]/50',
        active && 'bg-white border border-[#4695F3]',
        !active && 'border-transparent border',
        className,
      )}
      aria-selected={active}
    >
      <span className="max-w-[120px] truncate">{children}</span>
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="ml-1 opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label={`Close ${children}`}
        >
          <IcCrossSmall className="h-3 w-3" />
        </button>
      )}
      {color && (
        <span
          className="absolute bottom-[-8px] left-1/2 h-[4px] w-[60%] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
    </Ariakit.ToolbarItem>
  )
})

export interface SeparatorProps extends Ariakit.ToolbarSeparatorProps {}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(props, ref) {
  return (
    <Ariakit.ToolbarSeparator
      ref={ref}
      {...props}
      className={clsx('h-6 w-[1px] border-l border-[#EDEDED]', props.className)}
    />
  )
})

export interface NewSheetButtonProps extends Ariakit.ToolbarItemProps {
  ref?: Ref<HTMLButtonElement>
}

export const NewSheetButton = createComponent<NewSheetButtonProps>(function NewSheetButton(props: NewSheetButtonProps) {
  return (
    <Ariakit.ToolbarItem
      {...props}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-[6px] text-[#0C0C14]',
        'hover:bg-[#EDEDED]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4695F3]/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
      aria-label="Add new sheet"
    >
      <IcPlus className="h-4 w-4" />
    </Ariakit.ToolbarItem>
  )
})

export interface TabListProps extends ComponentPropsWithoutRef<'div'> {}

export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(props: TabListProps, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={clsx('flex h-10 flex-1 items-center gap-1 overflow-x-auto px-2', props.className)}
      role="tablist"
    >
      {props.children}
    </div>
  )
})

export interface StatusAreaProps extends ComponentPropsWithoutRef<'div'> {}

export const StatusArea = forwardRef<HTMLDivElement, StatusAreaProps>(function StatusArea(props: StatusAreaProps, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={clsx('flex items-center gap-4 px-4 text-[.75rem] text-[#8F8D8A]', props.className)}
    >
      {props.children}
    </div>
  )
})

export interface SheetSwitcherButtonProps extends Ariakit.ToolbarItemProps {
  ref?: Ref<HTMLButtonElement>
  hasHiddenSheets?: boolean
}

export const SheetSwitcherButton = createComponent<SheetSwitcherButtonProps>(function SheetSwitcherButton({
  hasHiddenSheets,
  ...props
}: SheetSwitcherButtonProps) {
  return (
    <Ariakit.ToolbarItem
      {...props}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-[6px] text-[#0C0C14]',
        'hover:bg-[#EDEDED]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4695F3]/50',
        hasHiddenSheets && 'text-[#4695F3]',
        props.className,
      )}
      aria-label="Show all sheets"
    >
      <IcHamburger className="h-4 w-4" />
    </Ariakit.ToolbarItem>
  )
})
