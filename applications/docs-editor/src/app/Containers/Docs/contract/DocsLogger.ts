/** Logging supplied by the Docs host. */
type DocsLogArgument = string | number | boolean | object | null | undefined

export type DocsLogger = {
  info: (message: string, ...details: DocsLogArgument[]) => void
  warn: (message: string, ...details: DocsLogArgument[]) => void
  error: (message: string, ...details: DocsLogArgument[]) => void
}
