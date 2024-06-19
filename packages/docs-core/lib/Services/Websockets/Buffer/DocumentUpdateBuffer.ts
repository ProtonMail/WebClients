import { NodeMeta } from '@proton/drive-store'
import { LoggerInterface } from '@proton/utils/logs'
import { mergeUpdates } from 'yjs'

/** How often to automatically flush */
const AUTO_FLUSH_INTERVAL = 30_000

/** If no updates are queued for this amount of time, commit immediately after this period rather than waiting the global counter */
const COMMIT_AFTER_INACTIVITY_PERIOD = 10_000

/**
 * An object that collects document updates and occasionally dispatches them, merging them into one update before so.
 */
export class DocumentUpdateBuffer {
  readonly buffer: Uint8Array[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private idleTimeout: NodeJS.Timeout | null = null
  private bufferingEnabled = true

  constructor(
    public readonly document: NodeMeta,
    private logger: LoggerInterface,
    private onFlush: (mergedUpdate: Uint8Array) => void,
  ) {
    this.flushInterval = setInterval(() => this.flush(), AUTO_FLUSH_INTERVAL)
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
    }

    ;(this.onFlush as unknown) = undefined
  }

  get isBufferEnabled(): boolean {
    return this.bufferingEnabled
  }

  get idlePeriod(): number {
    return COMMIT_AFTER_INACTIVITY_PERIOD
  }

  setBufferEnabled(enabled: boolean): void {
    this.bufferingEnabled = enabled

    this.logger.info(`Buffering is now ${enabled ? 'enabled' : 'disabled'}`)
  }

  public addUpdate(update: Uint8Array): void {
    if (!this.bufferingEnabled) {
      this.logger.debug('Buffering is disabled. Flushing 1 update immediately.')
      this.onFlush(update)

      return
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
    }

    this.idleTimeout = setTimeout(() => {
      this.logger.info('Flushing due to inactivity')
      this.flush()
    }, this.idlePeriod)

    this.buffer.push(update)

    this.logger.info(`Added update to buffer. Buffer length: ${this.buffer.length}`)
  }

  public hasPendingUpdates(): boolean {
    return this.buffer.length > 0
  }

  public flush(): void {
    this.logger.info(`Flushing buffer. Buffer length: ${this.buffer.length}`)

    if (this.buffer.length === 0) {
      return
    }

    const updates = this.buffer.slice()

    this.buffer.length = 0

    const merged = mergeUpdates(updates)

    this.onFlush(merged)
  }
}
