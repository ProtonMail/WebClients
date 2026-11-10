/** The host's logger, injected. Do not log private or sensitive information. */
export type Logger = {
  debug: (message: string, data?: object) => void
  error: (message: string, data?: object) => void
}
