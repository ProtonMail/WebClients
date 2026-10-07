import { Logger, type LoggerInterface } from '@proton/shared/lib/logs'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'

export const sharedLogger = new Logger('proton-docs', DOCS_DEBUG_KEY)

export function loggerForSDK(logger: LoggerInterface) {
  return {
    log: ({
      level,
      loggerName,
      message,
      error,
    }: {
      level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
      loggerName: string
      message: string
      error?: unknown
    }) => {
      const levelToReporter = {
        DEBUG: (args: any[]) => logger.debug(...args),
        INFO: (args: any[]) => logger.info(...args),
        WARNING: (args: any[]) => logger.warn(...args),
        ERROR: (args: any[]) => logger.error(...args),
      } as const
      const report = levelToReporter[level]
      const formattedMessage = `[Drive SDK][${loggerName}] ${message}`
      if (error) {
        report([formattedMessage, error])
      } else {
        report([formattedMessage])
      }
    },
    getLogs: () => logger.getLogs().split('\n'),
  }
}
