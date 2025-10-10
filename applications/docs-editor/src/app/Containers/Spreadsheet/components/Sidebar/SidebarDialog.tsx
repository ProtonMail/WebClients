import React, { forwardRef, memo, useEffect, useId, useLayoutEffect, useMemo } from 'react'
import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'
import { useEvent } from '../utils'
import {
  SidebarDialogContext,
  type SidebarDialogContextValue,
  useSidebarContext,
  useSidebarDialogContext,
} from './shared'
import { Icon } from '../ui'
import { createStringifier } from '../../stringifier'

const { s } = createStringifier(strings)

export interface SidebarDialogHeaderProps {
  title: string
}

export function SidebarDialogHeader({ title }: SidebarDialogHeaderProps) {
  const { sidebarDialog } = useSidebarDialogContext()

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b-[0.5px] border-[#EAE7E4] px-4 pb-2 pt-6">
      <h1 className="text-lg font-bold">{title}</h1>

      <button
        type="button"
        className="flex size-[36px] items-center justify-center"
        aria-label={s('Close')}
        onClick={() => sidebarDialog.setOpen(false)}
      >
        <Icon legacyName="cross" />
      </button>
    </div>
  )
}

export interface SidebarDialogProps extends Ariakit.DialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  children?: React.ReactNode
}

export const SidebarDialog = memo(
  forwardRef<HTMLDivElement, SidebarDialogProps>(function SidebarDialog({ open, setOpen, className, children }, ref) {
    const id = useId()
    const { onChange, closeDialog, activeDialogId } = useSidebarContext()
    const isActive = activeDialogId === id

    const handleChange = useEvent(() => {
      onChange({ id, open, setOpen })
    })

    useLayoutEffect(handleChange, [handleChange, open])
    useEffect(() => {
      return () => {
        closeDialog(id)
      }
    }, [closeDialog, id])

    const contextValue = useMemo<SidebarDialogContextValue>(() => {
      return { sidebarDialog: { id, open, setOpen } }
    }, [id, open, setOpen])

    return (
      <Ariakit.DialogProvider open={isActive}>
        <Ariakit.Dialog
          modal={false}
          hideOnInteractOutside={false}
          unmountOnHide
          hideOnEscape={false}
          className={clsx('absolute inset-0 outline-none', className)}
          ref={ref}
        >
          <SidebarDialogContext.Provider value={contextValue}>{children}</SidebarDialogContext.Provider>
        </Ariakit.Dialog>
      </Ariakit.DialogProvider>
    )
  }),
)

function strings() {
  return {
    Close: c('sheets_2025:Spreadsheet sidebar conditional format dialog close').t`Close`,
  }
}
