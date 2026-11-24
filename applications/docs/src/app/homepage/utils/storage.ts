import type { HomepageMessages } from '../messages/defaultHomepageMessages'

/**
 * The user's storage, as the host computes it: Proton's `getAppSpace(getSpace(user), APPS.PROTONDOCS)`, and with
 * `upgradeHref` only when the user can add storage (`getCanAddStorage`). The sidebar shows it only when `maxSpace`
 * is above 0, as Proton's `Sidebar` does.
 */
export type HomepageStorage = {
  usedSpace: number
  maxSpace: number
  /** Where "Upgrade storage" leads. */
  upgradeHref?: string
  /** Opens `upgradeHref` in a new tab instead of this one, as Proton's `SettingsLink` does in an iframe. */
  openUpgradeInNewTab?: boolean
}

export type StorageLevel = 'success' | 'warning' | 'danger'

/** As Proton's `Sidebar`: `percentage()` of `@proton/utils`, kept to four decimals, rounded up. */
export function getStoragePercentage({ usedSpace, maxSpace }: HomepageStorage) {
  if (!maxSpace || !usedSpace) {
    return 0
  }
  return Math.ceil((usedSpace / maxSpace) * 100 * 10000) / 10000
}

/** Proton's `getMeterColor` with its default bounds: below 50% success, below 80% warning, above danger. */
export function getStorageLevel(percentage: number): StorageLevel {
  if (percentage >= 80) {
    return 'danger'
  }
  if (percentage >= 50) {
    return 'warning'
  }
  return 'success'
}

const UNITS = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 } as const

/** Proton's `humanSize` with its defaults (`@proton/shared/lib/helpers/humanSize`): up to GB, two decimals but bytes. */
export function formatStorageSize(bytes: number, messages: HomepageMessages['storage']) {
  if (bytes < UNITS.KB) {
    const value = Number(bytes.toFixed(1))
    return `${value} ${messages.bytes(value)}`
  }
  let unit: keyof typeof UNITS = 'GB'
  if (bytes < UNITS.MB) {
    unit = 'KB'
  } else if (bytes < UNITS.GB) {
    unit = 'MB'
  }
  return `${(bytes / UNITS[unit]).toFixed(2)} ${messages[unit]}`
}
