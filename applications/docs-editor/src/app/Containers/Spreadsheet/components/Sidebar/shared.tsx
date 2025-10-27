import { type ComponentPropsWithRef, createContext, forwardRef, useContext } from 'react'
import * as Ariakit from '@ariakit/react'
import { Icon } from '../ui'
import clsx from '@proton/utils/clsx'
import { createComponent } from '../utils'

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
    <div className={'relative isolate h-[36px] rounded-lg border border-[#ADABA8]'}>
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
    <span className="flex size-5 items-center justify-center rounded border-[1px] border-[#ADABA8]">
      <span className="mt-[-2px] hidden group-has-[[aria-checked='true']]:block aria-checked:block group-aria-checked:block">
        <Icon legacyName="checkmark" />
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
    <label className={clsx('group inline-flex select-none items-center gap-2 text-sm', className)}>
      <Ariakit.VisuallyHidden>
        <Ariakit.Checkbox {...props} />
      </Ariakit.VisuallyHidden>
      <FormCheckmarkIcon />
      {children}
    </label>
  )
})
