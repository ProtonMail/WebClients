import React from 'react'
import { ConditionalFormatDialog } from './ConditionalFormatDialog'
import { DataValidationDialog } from './DataValidationDialog'
import { NamedRangeEditorDialog } from './NamedRangeEditorDialog'
import { CellFormatDialog } from './CellFormatDialog'
import { SidebarContainer } from './SidebarContainer'
import { ChartEditorDialog } from './ChartEditorDialog'
import { TableEditorDialog } from './TableEditorDialog'

export function Sidebar() {
  return (
    <SidebarContainer>
      <ConditionalFormatDialog />
      <DataValidationDialog />
      <NamedRangeEditorDialog />
      <CellFormatDialog />
      <ChartEditorDialog />
      <TableEditorDialog />
    </SidebarContainer>
  )
}
