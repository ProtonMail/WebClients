import type { TableCellNode, TableRowNode } from '@lexical/table'
import type { NodeKey } from 'lexical'
import { createCommand } from 'lexical'

export type InsertTableCommandPayload = Readonly<{
  columns: string
  rows: string
  includeHeaders?: {
    rows: boolean
    columns: boolean
  }
  fullWidth?: boolean
}>

type InsertTableRowCommandPayload = Readonly<{
  insertAfter: boolean
}>

type InsertTableColumnCommandPayload = Readonly<{
  insertAfter: boolean
}>

export const INSERT_TABLE_COMMAND = createCommand<InsertTableCommandPayload>('INSERT_TABLE_COMMAND')
export const INSERT_TABLE_ROW_COMMAND = createCommand<InsertTableRowCommandPayload>('INSERT_TABLE_ROW_COMMAND')
export const INSERT_TABLE_COLUMN_COMMAND = createCommand<InsertTableColumnCommandPayload>('INSERT_TABLE_COLUMN_COMMAND')

export const DUPLICATE_TABLE_ROW_COMMAND = createCommand<TableRowNode>('DUPLICATE_TABLE_ROW_COMMAND')
export const DUPLICATE_TABLE_COLUMN_COMMAND = createCommand<TableCellNode>('DUPLICATE_TABLE_COLUMN_COMMAND')

export const DELETE_TABLE_COMMAND = createCommand<NodeKey>('DELETE_TABLE_COMMAND')
export const DELETE_TABLE_ROW_AT_SELECTION_COMMAND = createCommand('DELETE_TABLE_ROW_AT_SELECTION_COMMAND')
export const DELETE_TABLE_ROW_COMMAND = createCommand<TableRowNode>('DELETE_TABLE_ROW_COMMAND')
export const DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND = createCommand('DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND')
export const DELETE_TABLE_COLUMN_COMMAND = createCommand<TableCellNode>('DELETE_TABLE_COLUMN_COMMAND')
