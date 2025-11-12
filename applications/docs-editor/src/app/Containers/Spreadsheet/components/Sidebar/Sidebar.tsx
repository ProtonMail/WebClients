import React from 'react'
import { ConditionalFormatDialog } from './ConditionalFormatDialog'
import { DataValidationDialog } from './DataValidationDialog'
import { NamedRangeEditorDialog } from './NamedRangeEditorDialog'
import { CellFormatDialog } from './CellFormatDialog'
import { SidebarContainer } from './SidebarContainer'

export function Sidebar() {
  return (
    <SidebarContainer>
      <ConditionalFormatDialog />
      <DataValidationDialog />
      <NamedRangeEditorDialog />
      <CellFormatDialog />
    </SidebarContainer>
  )
}
