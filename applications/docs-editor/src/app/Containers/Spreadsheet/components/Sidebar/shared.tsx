import { type ComponentPropsWithRef, createContext, forwardRef, useContext } from 'react'
import * as Ariakit from '@ariakit/react'
import { Icon } from '../ui'
import clsx from '@proton/utils/clsx'
import { createComponent } from '../utils'
import { twMerge } from 'tailwind-merge'

export interface SidebarDialogStore {
  id: string
  open: boolean
  setOpen: (open: boolean) => void
}

export interface SidebarDialogContextValue {
  sidebarDialog: SidebarDialogStore
}

export const SidebarDialogContext = createContext<SidebarDialogContextValue | undefined>(undefined)

export function useSidebarDialogContext() {
  const context = useContext(SidebarDialogContext)
  if (context === undefined) {
    throw new Error('useSidebarDialogContext must be used within SidebarDialogContext.Provider')
  }

  return context
}

export type SidebarContextValue = {
  activeDialogId: string | null
  onChange: (dialog: SidebarDialogStore) => void
  closeDialog: (dialogId: string) => void
}

export const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within SidebarContext.Provider')
  }

  return context
}

export const NativeSelect = forwardRef<HTMLSelectElement, ComponentPropsWithRef<'select'>>(function NativeSelect(
  { ...props },
  ref,
) {
  return (
    <div className={'relative isolate h-[36px] rounded-lg border border-[#EAE7E4]'}>
      <select className="absolute inset-0 appearance-none px-3 text-[13px]" {...props} ref={ref} />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <Icon className="shrink-0" legacyName="chevron-down-filled" />
      </div>
    </div>
  )
})

export const FormGroup = forwardRef<HTMLDivElement, Ariakit.RoleProps>(function FormGroup(
  { className, ...props },
  ref,
) {
  return <Ariakit.Role className={clsx('grid gap-2', className)} {...props} ref={ref} />
})

export const FormLabel = createComponent(function FormLabel({ className, ...props }: Ariakit.RoleProps<'label'>) {
  return <Ariakit.Role.label className={clsx('text-sm font-semibold', className)} {...props} />
})

export function FormRadioIcon() {
  return (
    <span className="flex size-5 items-center justify-center rounded-full border-[1px] border-[#ADABA8]">
      <span className="hidden size-2 rounded-full bg-[#6D4AFF] group-has-[[aria-checked='true']]:block aria-checked:block group-aria-checked:block" />
    </span>
  )
}

export function FormCheckmarkIcon() {
  return (
    <span
      className={clsx(
        'flex size-5 items-center justify-center rounded border-[1px] border-[#ADABA8] transition',
        "group-has-[[aria-checked='true']]:border-0 aria-checked:border-0 group-aria-checked:border-0",
        "group-has-[[aria-checked='true']]:bg-[#6D4AFF] aria-checked:bg-[#6D4AFF] group-aria-checked:bg-[#6D4AFF]",
      )}
    >
      <span className="mt-[-2px] hidden group-has-[[aria-checked='true']]:block aria-checked:block group-aria-checked:block">
        <Icon legacyName="checkmark" stroke="white" />
      </span>
    </span>
  )
}

export const FormRadio = createComponent(function FormRadio({ children, className, ...props }: Ariakit.RadioProps) {
  return (
    <label className={clsx('group inline-flex items-center gap-2 text-sm', className)}>
      <Ariakit.VisuallyHidden>
        <Ariakit.Radio {...props} />
      </Ariakit.VisuallyHidden>
      <FormRadioIcon />
      {children}
    </label>
  )
})

export const FormCheckbox = createComponent(function FormRadio({
  children,
  className,
  ...props
}: Ariakit.CheckboxProps) {
  return (
    <label
      className={clsx(
        'group relative inline-flex select-none gap-2 rounded border border-[transparent] text-sm',
        '!outline-none transition has-[[data-focus-visible]]:border-[#6D4AFF] has-[[data-focus-visible]]:ring-[3px] has-[[data-focus-visible]]:ring-[#6D4AFF33]',
        className,
      )}
    >
      <Ariakit.VisuallyHidden>
        <Ariakit.Checkbox clickOnEnter {...props} />
      </Ariakit.VisuallyHidden>
      <FormCheckmarkIcon />
      {children}
    </label>
  )
})

export const Input = createComponent(function Input(props: ComponentPropsWithRef<'input'>) {
  return (
    <input
      {...props}
      className={clsx(
        'h-[36px] text-ellipsis rounded-lg border border-[#EAE7E4] px-3 text-sm !outline-none',
        'transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
    />
  )
})

export function SelectFallbackLabel() {
  const store = Ariakit.useSelectContext()

  return Ariakit.useStoreState(store, (s) => {
    const items = s?.items

    if (items) {
      const selectedItem = items.find((item) => item.value === s.value)
      if (selectedItem?.element?.textContent) {
        return selectedItem.element.textContent
      }
    }

    return ''
  })
}

export const Select = createComponent(function Select({ children, ...props }: Ariakit.SelectProps) {
  return (
    <Ariakit.Select
      {...props}
      className={clsx(
        'flex h-[36px] min-w-0 items-center gap-2 rounded-lg border border-[#EAE7E4] pl-3 text-left text-sm !outline-none',
        'transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
    >
      {children ?? <SelectFallbackLabel />}
      <span className="pointer-events-none ml-auto flex shrink-0 items-center pr-2">
        <Icon className="shrink-0" legacyName="chevron-down-filled" />
      </span>
    </Ariakit.Select>
  )
})

export const SelectPopover = createComponent(function (props: Ariakit.SelectPopoverProps) {
  return (
    <Ariakit.SelectPopover
      fixed
      gutter={4}
      {...props}
      className={clsx(
        'rounded-lg bg-[white] shadow-[0px_8px_24px_rgba(0,0,0,.16)] !outline-none ring-1 ring-[black]/10',
        'isolate z-[1] max-h-[min(var(--popover-available-height,440px),440px)] min-w-[140px] overflow-y-auto overscroll-y-contain',
        props.className,
      )}
    />
  )
})

export const SelectItem = createComponent(function SelectItem(props: Ariakit.SelectItemProps) {
  return (
    <Ariakit.SelectItem
      {...props}
      className={clsx(
        'flex h-[36px] cursor-pointer items-center gap-2 px-4 text-sm text-[#281D1B] !outline-none data-[active-item]:bg-[black]/5',
        props.className,
      )}
    />
  )
})

export const Menu = createComponent(function Menu(props: Ariakit.MenuProps) {
  return (
    <Ariakit.Menu
      gutter={4}
      {...props}
      className={clsx(
        'rounded-lg bg-[white] shadow-[0px_8px_24px_rgba(0,0,0,.16)] !outline-none ring-1 ring-[black]/10',
        'isolate z-[1] max-h-[min(var(--popover-available-height,440px),440px)] overflow-y-auto overscroll-y-contain',
        props.className,
      )}
    />
  )
})

export const MenuItem = createComponent(function MenuItem(props: Ariakit.MenuItemProps) {
  return (
    <Ariakit.MenuItem
      {...props}
      className={clsx(
        'flex h-[36px] cursor-pointer items-center gap-2 px-4 text-sm text-[#281D1B] !outline-none aria-disabled:opacity-50 data-[active-item]:bg-[black]/5',
        props.className,
      )}
    />
  )
})

export const ToggleButton = createComponent(function ToggleButton(props: Ariakit.CheckboxProps) {
  return (
    <Ariakit.Checkbox
      render={<Ariakit.Button />}
      {...props}
      className={clsx(
        'inline-flex h-[36px] items-center gap-2 rounded-lg border border-[#ADABA8] px-3 text-sm text-[#0C0C14] hover:bg-[black]/[0.03] aria-checked:bg-[#C2C0BE59] aria-disabled:opacity-50',
        '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
    />
  )
})

export const Button = createComponent(function Button(props: Ariakit.ButtonProps) {
  return (
    <Ariakit.Button
      {...props}
      className={twMerge(
        'border border-[#ADABA8] border-[transparent]',
        '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
    />
  )
})
