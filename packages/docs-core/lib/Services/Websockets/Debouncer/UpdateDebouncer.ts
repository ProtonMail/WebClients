import type { NodeMeta } from '@proton/drive-store'
import type { LoggerInterface } from '@proton/utils/logs'
import { mergeUpdates } from 'yjs'
import { DocumentDebounceMode } from './DocumentDebounceMode'
import { UpdateDebouncerEventType } from './UpdateDebouncerEventType'
import type { DecryptedValue } from '@proton/docs-proto'

/** When in realtime, we will perform a flush every 100ms, without waiting for inactivity. */
const REALTIME_STREAMING_PERIOD = 300

/** When in singleplayer, wait this period after inactivity before flush */
const SINGLE_PLAYER_DEBOUNCE_PERIOD = 2_500

/** Immediately flush the buffer if the cumalative buffer size exceeds this threshold */
const MAX_BUFFER_BYTE_SIZE_BEFORE_FLUSH = 250_000

type UpdateDebouncerEventPayload =
  | {
      type: UpdateDebouncerEventType.WillFlush
    }
  | {
      type: UpdateDebouncerEventType.DidFlush
      mergedUpdate: Uint8Array
    }

/**
 * An object that collects document updates and occasionally dispatches them, merging them into one update before so.
 */
export class UpdateDebouncer {
  readonly buffer: DecryptedValue<Uint8Array>[] = []
  realtimeStreamingInterval: ReturnType<typeof setInterval> | null = null
  singlePlayerIdleTimeout: ReturnType<typeof setTimeout> | null = null
  private mode: DocumentDebounceMode = DocumentDebounceMode.SinglePlayer
  currentBufferSize = 0
  isReadyToFlush = false

  constructor(
    public readonly document: NodeMeta,
    private logger: LoggerInterface,
    private onEvent: (event: UpdateDebouncerEventPayload) => void,
  ) {}

  public markAsReadyToFlush(): void {
    this.isReadyToFlush = true

    this.flush()
  }

  destroy(): void {
    if (this.realtimeStreamingInterval) {
      clearInterval(this.realtimeStreamingInterval)
    }
    if (this.singlePlayerIdleTimeout) {
      clearTimeout(this.singlePlayerIdleTimeout)
    }

    ;(this.onEvent as unknown) = undefined
  }

  getMode(): DocumentDebounceMode {
    return this.mode
  }

  get singlePlayerDebouncePeriod(): number {
    return SINGLE_PLAYER_DEBOUNCE_PERIOD
  }

  get realtimeStreamingPeriod(): number {
    return REALTIME_STREAMING_PERIOD
  }

  get maxSizeBeforeFlush(): number {
    return MAX_BUFFER_BYTE_SIZE_BEFORE_FLUSH
  }

  setMode(mode: DocumentDebounceMode): void {
    this.mode = mode

    if (mode === DocumentDebounceMode.Realtime) {
      this.realtimeStreamingInterval = setInterval(() => this.flush(), REALTIME_STREAMING_PERIOD)
    } else {
      if (this.realtimeStreamingInterval) {
        clearInterval(this.realtimeStreamingInterval)
        this.realtimeStreamingInterval = null
      }
    }

    this.logger.info(`Setting debounce mode to ${DocumentDebounceMode[mode]}`)
  }

  public addUpdates(updates: DecryptedValue<Uint8Array>[]): void {
    for (const update of updates) {
      this.buffer.push(update)

      this.currentBufferSize += update.decryptedValue.byteLength
    }

    this.onEvent({
      type: UpdateDebouncerEventType.WillFlush,
    })

    if (this.mode === DocumentDebounceMode.SinglePlayer) {
      if (this.singlePlayerIdleTimeout) {
        clearTimeout(this.singlePlayerIdleTimeout)
        this.singlePlayerIdleTimeout = null
      }

      this.singlePlayerIdleTimeout = setTimeout(() => {
        this.logger.info('Flushing due to inactivity')
        this.flush()
      }, this.singlePlayerDebouncePeriod)
    }

    this.logger.info(
      `Added update to buffer. Buffer length: ${this.buffer.length} Buffer size: ${this.currentBufferSize}`,
    )

    if (this.currentBufferSize >= this.maxSizeBeforeFlush) {
      this.logger.info('Flushing due to buffer size')
      this.flush()
    }
  }

  public hasPendingUpdates(): boolean {
    return this.buffer.length > 0
  }

  public flush(): void {
    if (this.buffer.length === 0) {
      return
    }

    if (!this.isReadyToFlush) {
      this.logger.info(`Not yet ready to flush.`)

      return
    }

    this.logger.info(`Flushing buffer. Buffer length: ${this.buffer.length}`)

    const updates = this.buffer.slice()

    this.buffer.length = 0

    this.currentBufferSize = 0

    const merged = mergeUpdates(updates.map((update) => update.decryptedValue))

    this.onEvent({
      type: UpdateDebouncerEventType.DidFlush,
      mergedUpdate: merged,
    })
  }
}
