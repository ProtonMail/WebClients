// Copy of packages/docs-shared/lib/ServerTime.ts, trimmed to what the homepage uses.

const MicrosecondsInAMillisecond = 1000
const MillisecondsInASecond = 1000

enum TimestampDigits {
  Seconds = 10,
  Milliseconds = 13,
  Microseconds = 16,
}

function convertTimestampToMilliseconds(timestamp: number): number {
  const digits = String(timestamp).length
  switch (digits) {
    case TimestampDigits.Seconds:
      return timestamp * MillisecondsInASecond
    case TimestampDigits.Milliseconds:
      return timestamp
    case TimestampDigits.Microseconds:
      return Math.floor(timestamp / MicrosecondsInAMillisecond)

    default:
      throw Error(`Unhandled timestamp precision: ${timestamp}`)
  }
}

export class ServerTime {
  constructor(public serverTimestamp: number) {}

  get milliseconds(): number {
    return convertTimestampToMilliseconds(this.serverTimestamp)
  }

  get date(): Date {
    return new Date(this.milliseconds)
  }
}
