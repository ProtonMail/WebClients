import { useFlag } from '@proton/unleash/useFlag'
import { isDevOrBlack } from '@proton/utils/env'

export function useIsSheetsStatusBarEnabled() {
  return useFlag('SheetsStatusBarEnabled') || isDevOrBlack()
}

export function useIsSheetsCustomNumberFormatEnabled() {
  return useFlag('SheetsCustomNumberFormatEnabled') || isDevOrBlack()
}

export function useIsSheetsCustomDateTimeFormatEnabled() {
  return useFlag('SheetsCustomDateTimeFormatEnabled') || isDevOrBlack()
}
