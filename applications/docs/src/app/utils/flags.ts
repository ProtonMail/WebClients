import { useFlag } from '@proton/unleash/useFlag'
import { isDevOrBlack } from '@proton/utils/env'

export function useSharingModalDriveSdkEnabled() {
  return useFlag('DocsSharingModalDriveSDK')
}

export function useLoadRecentsWithSdkEnabled() {
  return useFlag('DocsLoadRecentsWithDriveSDK') || isDevOrBlack()
}

/**
 * Checks if the user is allowed to download logs.
 * It will only be active for alpha and dev/black environments for now.
 * @returns true if the user is allowed to download logs, false otherwise.
 */
export function useIsDownloadLogsAllowed() {
  return useFlag('DownloadLogs')
}

export function useIsSheetsEnabled() {
  const killswitch = useFlag('DocsSheetsDisabled')
  return (useFlag('DocsSheetsEnabled') || isDevOrBlack()) && !killswitch
}

export function useIsSheetsEditorEnabled() {
  const killswitch = useFlag('DocsSheetsDisabled')
  return (useFlag('SheetsEditorEnabled') || isDevOrBlack()) && !killswitch
}
