import { LexicalCommand, createCommand } from 'lexical'

export type InsertTableCommandPayload = Readonly<{
  columns: string
  rows: string
  includeHeaders?: {
    rows: boolean
    columns: boolean
  }
  fullWidth?: boolean
}>

export const INSERT_TABLE_COMMAND: LexicalCommand<InsertTableCommandPayload> = createCommand('INSERT_TABLE_COMMAND')
