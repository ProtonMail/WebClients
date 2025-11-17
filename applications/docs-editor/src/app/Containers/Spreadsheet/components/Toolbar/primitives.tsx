import * as Ariakit from '@ariakit/react'
import * as Atoms from '../atoms'
import { useCompositeOverflowStore } from '@ariakit/react-core/composite/composite-overflow-store'
import { CompositeOverflow } from '@ariakit/react-core/composite/composite-overflow'
import {
  CompositeOverflowDisclosure,
  type CompositeOverflowDisclosureProps,
} from '@ariakit/react-core/composite/composite-overflow-disclosure'
import type { IconName } from '@proton/icons/types'
import clsx from '@proton/utils/clsx'
import {
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  forwardRef,
  useState,
} from 'react'
import { Icon, type IconData } from '../ui'
import * as UI from '../ui'
import { createComponent } from '../utils'
import { GroupsProvider, GroupTypeProvider, useGroup, useHasOverflow } from './groups'

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  mainToolbarSlot?: ReactNode
  overflowToolbarSlot?: ReactNode
  trailingSlot?: ReactNode
  formulaBarSlot?: ReactNode
  renderOverflowDisclosure: ReactElement
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  {
    mainToolbarSlot,
    overflowToolbarSlot,
    trailingSlot,
    formulaBarSlot,
    renderOverflowDisclosure,
    ...props
  }: ContainerProps,
  ref,
) {
  const overflow = useCompositeOverflowStore({ placement: 'bottom-end' })
  const [toolbarContainerElement, setToolbarContainerElement] = useState<HTMLDivElement | null>(null)
  return (
    <div ref={ref} {...props} className={clsx('select-none', props.className)}>
      <div className="border-weak rounded-[1rem] border bg-[white] shadow-[0_4px_10px_0_rgba(0,0,0,0.06)]">
        <GroupsProvider toolbarContainerElement={toolbarContainerElement}>
          <Ariakit.Toolbar className="flex grow gap-[.5rem] py-[.375rem]">
            <div
              className="flex grow items-center gap-[.5rem] overflow-hidden px-[.375rem]"
              ref={setToolbarContainerElement}
            >
              <GroupTypeProvider type="main">{mainToolbarSlot}</GroupTypeProvider>
            </div>
            <div className="flex shrink-0 items-center gap-[.5rem] px-[.375rem]">
              {overflowToolbarSlot ? (
                <Overflow store={overflow} renderOverflowDisclosure={renderOverflowDisclosure}>
                  <GroupTypeProvider type="overflow">{overflowToolbarSlot}</GroupTypeProvider>
                </Overflow>
              ) : null}
              {trailingSlot}
            </div>
          </Ariakit.Toolbar>
        </GroupsProvider>
        {formulaBarSlot}
      </div>
    </div>
  )
})

export interface OverflowProps extends CompositeOverflowDisclosureProps {
  renderOverflowDisclosure: ReactElement
}

export function Overflow({ store, children, renderOverflowDisclosure, ...props }: OverflowProps) {
  const hasOverflow = useHasOverflow()
  if (!hasOverflow) {
    return null
  }
  return (
    <>
      <CompositeOverflowDisclosure store={store} {...props} render={renderOverflowDisclosure} />

      <Atoms.DropdownPopover
        {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
        className="flex !flex-wrap items-center gap-[.5rem] !rounded-[1rem] !p-[.375rem]"
        render={<CompositeOverflow store={store}>{children}</CompositeOverflow>}
      />
    </>
  )
}

export interface GroupProps extends ComponentPropsWithRef<'div'> {
  groupId: string
}

export function Group({ children, groupId, ...props }: GroupProps) {
  const group = useGroup(groupId)
  return (
    <div
      {...group.props}
      {...props}
      className={clsx('flex shrink-0 items-center gap-[.125rem]', props.className, group.props.className)}
    >
      {children}
      {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
      <Separator {...group.separatorProps} className={clsx('ml-[.375rem]', group.separatorProps.className)} />
    </div>
  )
}

export interface ItemProps extends Ariakit.ToolbarItemProps {
  ref?: Ref<HTMLButtonElement>
  /** @default 'icon' */
  variant?: 'icon' | 'icon-small' | 'label'
  icon?: IconData
  /** @deprecated Use `icon` instead */
  legacyIconName?: IconName
  pressed?: boolean
  dropdownIndicator?: boolean
  children?: string
  /** If not provided, `children` will be used. */
  accessibilityLabel?: string
  shortcut?: ReactNode
}

export const Item = createComponent<ItemProps>(function Item({
  variant = 'icon',
  icon,
  legacyIconName,
  pressed,
  dropdownIndicator,
  children,
  accessibilityLabel = children,
  shortcut,
  ...props
}: ItemProps) {
  const displayLabel = Boolean(variant === 'label')
  let pressedValue: 'true' | 'false' | undefined = undefined
  if (pressed != null) {
    pressedValue = pressed ? 'true' : 'false'
  }
  const outputProps = {
    ...props,
    className: clsx(
      'flex shrink-0 items-center justify-center gap-[.375rem] rounded-[.625rem] text-[#0C0C14] focus:outline-none aria-disabled:text-[#8F8D8A]',
      'aria-expanded:bg-[#C2C1C0]/20',
      variant === 'icon' && 'p-[.625rem]',
      variant === 'icon-small' && 'p-[.375rem]',
      variant === 'label' && 'p-2',
      'bg-[white]',
      // TODO: "hocus" type tw variant
      'hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
      // TODO: "active" tw variant
      // TODO: see hack for specificity, otherwise active styles are overridden by data-[focus-visible] :(
      'active:active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
      'aria-pressed:aria-pressed:bg-[#C2C0BE]/35',

      props.className,
    ),
  }

  const showTooltip = !displayLabel || Boolean(shortcut)
  const content = (
    <Ariakit.ToolbarItem
      {...(showTooltip ? {} : outputProps)}
      aria-label={!displayLabel || accessibilityLabel !== children ? accessibilityLabel : undefined}
      aria-pressed={pressedValue}
      accessibleWhenDisabled
    >
      {(icon || legacyIconName) && <Icon className="shrink-0" data={icon} legacyName={legacyIconName} />}
      {displayLabel && <span className="grow truncate text-start text-[.875rem]">{children}</span>}
      {dropdownIndicator && <Icon className="shrink-0" legacyName="chevron-down-filled" />}
    </Ariakit.ToolbarItem>
  )

  if (!showTooltip) {
    return content
  }
  return (
    <Ariakit.TooltipProvider placement="bottom">
      {/* @ts-expect-error - fix typings */}
      <Ariakit.TooltipAnchor {...outputProps} render={content} />
      <UI.Tooltip trailingSlot={shortcut ? shortcut : undefined}>{accessibilityLabel}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

export interface SeparatorProps extends Ariakit.ToolbarSeparatorProps {}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(props, ref) {
  return (
    <Ariakit.ToolbarSeparator
      ref={ref}
      {...props}
      className={clsx('h-[1.25rem] w-[1px] flex-shrink-0 border-l border-[#D1CFCD]', props.className)}
    />
  )
})

// TODO:
// - tooltips
// - button with visible label?
// - focus & focus visible styles
// - button active styles
// - trigger open styles
