/** Logging supplied by the Sheets host. */
type SheetsLogArgument = string | number | boolean | object | null | undefined

export type SheetsLogger = {
  info: (message: string, ...details: SheetsLogArgument[]) => void
  warn: (message: string, ...details: SheetsLogArgument[]) => void
  error: (message: string, ...details: SheetsLogArgument[]) => void
}
