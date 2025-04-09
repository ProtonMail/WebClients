import { dateLocale } from '@proton/shared/lib/i18n'

const MILLISECONDS_IN_DAY = 86400000

export class DateFormatter {
  private relativeDayFormatter = new Intl.RelativeTimeFormat(dateLocale.code, { numeric: 'auto' })
  private weekdayFormatter = new Intl.DateTimeFormat(dateLocale.code, { weekday: 'long' })
  private dateFormatter = new Intl.DateTimeFormat(dateLocale.code, {
    day: 'numeric',
    month: 'short',
  })
  private timeFormatter = new Intl.DateTimeFormat(dateLocale.code, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  private getDifferenceInDays(date1: Date | number, date2: Date | number) {
    const date1StartOfDay = new Date(date1).setHours(0, 0, 0, 0)
    const date2StartOfDay = new Date(date2).setHours(0, 0, 0, 0)

    return (date1StartOfDay - date2StartOfDay) / MILLISECONDS_IN_DAY
  }

  formatDate(date: Date | number) {
    const differenceInDays = this.getDifferenceInDays(date, new Date())
    const isYesterdayOrToday = differenceInDays > -2
    const isWithinAWeek = differenceInDays > -6

    if (isYesterdayOrToday) {
      return this.relativeDayFormatter.format(differenceInDays, 'day')
    }

    if (isWithinAWeek) {
      return this.weekdayFormatter.format(date)
    }

    return this.dateFormatter.format(date)
  }

  formatTime(date: Date | number) {
    return this.timeFormatter.format(date)
  }

  formatDateOrTimeIfToday(date: Date | number, justNowLabel: string) {
    const now = new Date()
    const differenceInMilliseconds = now.getTime() - new Date(date).getTime()
    const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000)
    const differenceInMinutes = Math.floor(differenceInSeconds / 60)
    const differenceInHours = Math.floor(differenceInMinutes / 60)

    if (differenceInHours >= 12) {
      return this.formatTime(date) // Absolute time
    } else if (differenceInHours >= 1) {
      return this.relativeDayFormatter.format(-differenceInHours, 'hour') // "n hours ago"
    } else if (differenceInMinutes >= 1) {
      return this.relativeDayFormatter.format(-differenceInMinutes, 'minute') // "n minutes ago"
    } else if (differenceInSeconds >= 15) {
      return this.relativeDayFormatter.format(-differenceInSeconds, 'second') // "n seconds ago"
    } else {
      return justNowLabel // Less than 15 seconds
    }
  }
}
