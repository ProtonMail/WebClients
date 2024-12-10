import type { LoggerInterface } from '@proton/utils/logs'

let instance: LoadLogger | undefined

export class LoadLogger {
  private constructTime: Date

  static initialize(logger: LoggerInterface) {
    instance = new LoadLogger(logger)
  }

  static logEventRelativeToLoadTime(eventName: string) {
    if (!instance) {
      throw new Error('LoadMetrics instance not initialized')
    }
    const timeInMs = new Date().getTime() - instance.constructTime.getTime()
    instance.logger.info(`${eventName} took ${timeInMs}ms from page load`)
  }

  constructor(private logger: LoggerInterface) {
    this.constructTime = new Date()
  }
}
