import React, { useMemo, useState, type PropsWithChildren } from 'react'
import clsx from '@proton/utils/clsx'
import { produce } from 'immer'
import { useEvent } from '../utils'
import { onlyImplementedFunctionDescriptions as functionDescriptions } from '../../constants'
import { ConditionalFormatDialog } from './ConditionalFormatDialog'
import type { ProtonSheetsState } from '../../state'
import { SidebarContext, type SidebarContextValue, type SidebarDialogStore } from './shared'
import { DataValidationDialog } from './DataValidationDialog'

function SidebarContainer(props: PropsWithChildren) {
  const [dialogs, setDialogs] = useState<SidebarDialogStore[]>([])

  const activeDialogId = useMemo(() => {
    const activeDialog = dialogs.findLast((dialog) => dialog.open)
    if (activeDialog) {
      return activeDialog.id
    }

    return null
  }, [dialogs])

  const openDialog = useEvent((dialog: SidebarDialogStore) => {
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

  const onChange: SidebarContextValue['onChange'] = useEvent((dialog) => {
    if (dialog.open) {
      openDialog(dialog)
    } else {
      closeDialog(dialog.id)
    }
  })

  const contextValue: SidebarContextValue = { activeDialogId, onChange, closeDialog }

  return (
    <div className={clsx('h-full min-h-0 w-[340px] min-w-0 shrink-0 px-2', activeDialogId === null && 'hidden')}>
      <div className="relative h-full min-h-0 w-full overflow-hidden rounded-t-[16px] border-[0.5px] border-[#EAE7E4] bg-[white] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.1)]">
        <SidebarContext.Provider value={contextValue}>{props.children}</SidebarContext.Provider>
      </div>
    </div>
  )
}

interface SidebarProps {
  state: ProtonSheetsState
}

export function Sidebar({ state }: SidebarProps) {
  return (
    <SidebarContainer>
      <ConditionalFormatDialog
        sheetId={state.activeSheetId}
        theme={state.theme}
        conditionalFormats={state.conditionalFormats}
        functionDescriptions={functionDescriptions}
        onCreateRule={state.onCreateConditionalFormattingRule}
        onDeleteRule={state.onDeleteConditionalFormattingRule}
        onUpdateRule={state.onUpdateConditionalFormattingRule}
        onPreviewRule={state.onPreviewConditionalFormattingRule}
      />
      <DataValidationDialog
        dataValidations={state.dataValidations}
        sheetId={state.activeSheetId}
        functionDescriptions={functionDescriptions}
        onDeleteRules={state.onDeleteDataValidationRules}
        onDeleteRule={state.onDeleteDataValidationRule}
        onCreateRule={state.onCreateDataValidationRule}
        onUpdateRule={state.onUpdateDataValidationRule}
      />
    </SidebarContainer>
  )
}
