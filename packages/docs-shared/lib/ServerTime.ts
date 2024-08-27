import { convertTimestampToMilliseconds } from './convertTimestampToMilliseconds'

function createFormatter(languageCode: Intl.LocalesArgument) {
  return new Intl.RelativeTimeFormat(languageCode, {
    localeMatcher: 'best fit',
    numeric: 'auto',
    style: 'short',
  })
}

let rtf = createFormatter('en')
let lastUsedRtfLanguage: Intl.LocalesArgument = 'en'

export class ServerTime {
  constructor(public serverTimestamp: number) {}

  get milliseconds(): number {
    return convertTimestampToMilliseconds(this.serverTimestamp)
  }

  get relativeSeconds(): number {
    return Math.round((this.milliseconds - Date.now()) / 1000)
  }

  get relativeMinutes(): number {
    return Math.round(this.relativeSeconds / 60)
  }

  isNewerThan(number: number, type: 'seconds' | 'minutes') {
    if (type === 'seconds') {
      return this.relativeSeconds > -number
    } else if (type === 'minutes') {
      return this.relativeMinutes > -number
    }
  }

  relativeFormat(time: number, unit: Intl.RelativeTimeFormatUnit, languageCode: Intl.LocalesArgument) {
    if (lastUsedRtfLanguage !== languageCode) {
      try {
        rtf = createFormatter(languageCode)
        lastUsedRtfLanguage = languageCode
      } catch (error) {
        rtf = createFormatter('en')
        lastUsedRtfLanguage = 'en'
      }
    }

    return rtf.format(time, unit)
  }

  static now(): ServerTime {
    return new ServerTime(Math.round(Date.now() / 1000))
  }
}
