export function hours_to_ms(hours: number): number {
  return hours * 60 * 60 * 1000
}

export function minutes_to_ms(minutes: number): number {
  return minutes * 60 * 1000
}

export function seconds_to_ms(seconds: number): number {
  return seconds * 1000
}
