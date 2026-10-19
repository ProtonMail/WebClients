import type { DocsCommentTime } from '../contract/DocsCommentThread'
import type { DocsDateFormat } from '../contract/DocsDateFormat'

const MillisecondsInASecond = 1000
const MicrosecondsInAMillisecond = 1000

const SecondsTimestampDigits = 10
const MillisecondsTimestampDigits = 13
const MicrosecondsTimestampDigits = 16

const SameDayOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' }
const OtherDayOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: 'numeric',
}

/** Hosts send timestamps in seconds, milliseconds or microseconds; only their length tells them apart. */
export function commentDate(time: DocsCommentTime): Date {
  const { serverTimestamp } = time
  switch (String(serverTimestamp).length) {
    case SecondsTimestampDigits:
      return new Date(serverTimestamp * MillisecondsInASecond)
    case MillisecondsTimestampDigits:
      return new Date(serverTimestamp)
    case MicrosecondsTimestampDigits:
      return new Date(Math.floor(serverTimestamp / MicrosecondsInAMillisecond))
    default:
      throw Error(`Unhandled timestamp precision: ${serverTimestamp}`)
  }
}

/** Negative in the past, as Intl.RelativeTimeFormat counts. */
function relativeSeconds(time: DocsCommentTime): number {
  return Math.round((commentDate(time).getTime() - Date.now()) / 1000)
}

function relativeMinutes(time: DocsCommentTime): number {
  return Math.round(relativeSeconds(time) / 60)
}

export function isNewerThan(time: DocsCommentTime, amount: number, unit: 'seconds' | 'minutes'): boolean {
  const relative = unit === 'seconds' ? relativeSeconds(time) : relativeMinutes(time)
  return relative > -amount
}

const RelativeOptions: Intl.RelativeTimeFormatOptions = {
  localeMatcher: 'best fit',
  numeric: 'auto',
  style: 'short',
}

/** The host's language code is not guaranteed to be one Intl knows; English keeps the time readable. */
export function formatRelativeTime(time: DocsCommentTime, languageCode: Intl.LocalesArgument): string {
  const minutes = relativeMinutes(time)
  try {
    return new Intl.RelativeTimeFormat(languageCode, RelativeOptions).format(minutes, 'minute')
  } catch {
    return new Intl.RelativeTimeFormat('en', RelativeOptions).format(minutes, 'minute')
  }
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function formatAbsoluteTime(time: DocsCommentTime, { localeCode, hourCycle }: DocsDateFormat): string {
  const date = commentDate(time)
  const options = { hourCycle, ...(isToday(date) ? SameDayOptions : OtherDayOptions) }
  try {
    return new Intl.DateTimeFormat(localeCode, options).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', options).format(date)
  }
}
