const MinimumJitterFactor = 1
const MaximumJitterFactor = 1.5
const MaxBackoffInMilliseconds = 32_000

/**
 * If the connection is still connected after this time, reset backoff attempts. This is to avoid cases where a conneciton open then quickly shutters, which would bypass increasing exponentinal backoff. Instead, we wait this interval before deciding to reset connection attempts
 */
const BackoffResetThresholdInMilliseconds = 10_000

export interface WebsocketStateInterface {
  didOpen(): void
  didFailToFetchToken(): void
  didClose(): void
  isConnected: boolean
  getBackoff(): number
}

export class WebsocketState implements WebsocketStateInterface {
  private attempts = 0
  private connected: boolean = false
  private resetTimeout: ReturnType<typeof setTimeout> | null = null

  didOpen() {
    this.connected = true

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }

    this.resetTimeout = setTimeout(() => {
      if (this.connected) {
        this.resetAttempts()
      }
    }, BackoffResetThresholdInMilliseconds)
  }

  destroy() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
  }

  didFailToFetchToken() {
    this.incrementAttempts()
  }

  didClose() {
    this.connected = false

    this.incrementAttempts()
  }

  get isConnected(): boolean {
    return this.connected
  }

  getBackoff(): number {
    return this.getBackoffWithoutJitter() * this.getJitterFactor()
  }

  getBackoffWithoutJitter(): number {
    const exponent = Math.max(this.attempts, 1)
    const backoff = Math.pow(2, exponent) * 1000

    return Math.min(backoff, MaxBackoffInMilliseconds)
  }

  getJitterFactor(): number {
    return Math.random() * (MaximumJitterFactor - MinimumJitterFactor) + MinimumJitterFactor
  }

  get attemptCount(): number {
    return this.attempts
  }

  incrementAttempts() {
    this.attempts++
  }

  resetAttempts() {
    this.attempts = 0
  }
}
