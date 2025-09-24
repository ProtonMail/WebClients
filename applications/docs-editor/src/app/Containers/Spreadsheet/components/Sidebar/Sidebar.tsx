import React, {
  createContext,
  forwardRef,
  memo,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { produce } from 'immer'
import { useEvent } from '../utils'

// Uncomment these when ready to test or build
// import { ConditionalFormatDialog } from './ConditionalFormatDialog'
// import { DataValidationDialog } from './DataValidationDialog'
// import { NamedRangeEditorDialog } from './NamedRangeEditorDialog'

interface SidebarDialogType {
  id: string
  open: boolean
  setOpen: (open: boolean) => void
}

type SidebarContextType = {
  activeDialogId: string | null
  onChange: (dialog: SidebarDialogType) => void
  closeDialog: (dialogId: string) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within SidebarContext.Provider')
  }

  return context
}

function SidebarContainer(props: PropsWithChildren) {
  const [dialogs, setDialogs] = useState<SidebarDialogType[]>([])

  const activeDialogId = useMemo(() => {
    const activeDialog = dialogs.findLast((dialog) => dialog.open)
    if (activeDialog) {
      return activeDialog.id
    }

    return null
  }, [dialogs])

  const openDialog = useEvent((dialog: SidebarDialogType) => {
    setDialogs(
      produce((draftDialogs) => {
        const indexToRemove = draftDialogs.findIndex((d) => d.id === dialog.id)
        if (indexToRemove !== -1) {
          draftDialogs.splice(indexToRemove, 1)
        }
        draftDialogs.push(dialog)

        for (let i = 0; i < draftDialogs.length - 1; i++) {
          const dialog = draftDialogs[i]
          if (dialog.open) {
            dialog.open = false
            dialog.setOpen(false)
          }
        }
      }),
    )
  })

  const closeDialog = useEvent((dialogId: string) => {
    setDialogs(
      produce((draftDialogs) => {
        const indexToRemove = draftDialogs.findIndex((d) => d.id === dialogId && d.open)
        if (indexToRemove !== -1) {
          draftDialogs.splice(indexToRemove, 1)
        }

        if (draftDialogs.length > 0) {
          const indexOfOpenDialog = draftDialogs.findIndex((d) => d.open)
          if (indexOfOpenDialog === -1) {
            const indexOfMostRecentlyHiddenDialog = draftDialogs.findLastIndex((d) => d.open === false)
            if (indexOfMostRecentlyHiddenDialog !== -1) {
              const mostRecentlyHiddenDialog = draftDialogs[indexOfMostRecentlyHiddenDialog]
              mostRecentlyHiddenDialog.open = true
              mostRecentlyHiddenDialog.setOpen(true)
            }
          }
        }
      }),
    )
  })

  const onChange: SidebarContextType['onChange'] = useEvent((dialog) => {
    if (dialog.open) {
      openDialog(dialog)
    } else {
      closeDialog(dialog.id)
    }
  })

  const contextValue: SidebarContextType = { activeDialogId, onChange, closeDialog }

  return (
    <div className={clsx('h-full w-[340px] min-w-0 shrink-0 px-2', activeDialogId === null && 'hidden')}>
      <div className="relative h-full w-full overflow-hidden rounded-t-[16px] border-[0.5px] border-[#EAE7E4] bg-[white] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.1)]">
        <SidebarContext.Provider value={contextValue}>{props.children}</SidebarContext.Provider>
      </div>
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

    if (!isActive) {
      return null
    }

    return (
      <Ariakit.DialogProvider open={isActive}>
        <Ariakit.Dialog
          modal={false}
          hideOnInteractOutside={false}
          unmountOnHide
          hideOnEscape={false}
          onClose={() => closeDialog(id)}
          className={clsx('absolute inset-0 outline-none', className)}
          ref={ref}
        >
          {children}
        </Ariakit.Dialog>
      </Ariakit.DialogProvider>
    )
  }),
)

export function Sidebar() {
  return (
    <SidebarContainer>
      {/* Uncomment these when ready to test or build */}
      {/* <ConditionalFormatDialog /> */}
      {/* <DataValidationDialog /> */}
      {/* <NamedRangeEditorDialog /> */}
    </SidebarContainer>
  )
}
