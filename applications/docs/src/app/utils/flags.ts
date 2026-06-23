import { useFlag } from '@proton/unleash/useFlag'
import { isDevOrBlack } from '@proton/utils/env'

/*
DocsSharingModalDriveSDK - no dependencies

DocsLoadRecentsWithDriveSDK - no dependencies
DocsDocumentViewerEventsSDK - no dependencies

DocsRenameWithDriveSDK - needs DocsLoadRecentsWithDriveSDK and DocsDocumentViewerEventsSDK for the events

DocsMoveModalDriveSDK - needs DocsRenameWithDriveSDK because SDK rename updates cache (+ events)
*/

export function useSharingModalDriveSdkEnabled() {
  return useFlag('DocsSharingModalDriveSDK') || isDevOrBlack()
}

export function useLoadRecentsWithSdkEnabled() {
  return useFlag('DocsLoadRecentsWithDriveSDK')
}

export function useDocsDocumentViewerEventsSDK() {
  return useFlag('DocsDocumentViewerEventsSDK')
}

export function useRenameWithSDK() {
  return useFlag('DocsRenameWithDriveSDK')
}

export function useMoveModalDriveSdkEnabled() {
  return useFlag('DocsMoveModalDriveSDK')
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
