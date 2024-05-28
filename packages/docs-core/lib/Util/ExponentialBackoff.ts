const MinimumJitterFactor = 1
const MaximumJitterFactor = 1.5

const MaxBackoffInMilliseconds = 32_000

export class ExponentialBackoff {
  private attempts = 0

  incrementAttempts() {
    this.attempts++
  }

  resetAttempts() {
    this.attempts = 0
  }

  getBackoffTime(): number {
    const exponent = Math.max(this.attempts, 1)
    const backoff = Math.pow(2, exponent) * 1000
    return Math.min(backoff, MaxBackoffInMilliseconds)
  }

  getJitterFactor(): number {
    return Math.random() * (MaximumJitterFactor - MinimumJitterFactor) + MinimumJitterFactor
  }

  getBackoffWithJitter(): number {
    return this.getBackoffTime() * this.getJitterFactor()
  }
}
