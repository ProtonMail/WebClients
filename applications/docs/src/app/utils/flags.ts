import { useFlag } from '@proton/unleash/useFlag'
import { isDevOrBlack } from '@proton/utils/env'

/*
DocsSharingModalDriveSDK - no dependencies
DocsLoadRecentsWithDriveSDK - no dependencies
DocsDocumentViewerEventsSDK - no dependencies
DocsTrashWithDriveSDK - no dependencies
DocsRenameWithDriveSDK - needs DocsLoadRecentsWithDriveSDK and DocsDocumentViewerEventsSDK for the events
DocsMoveModalDriveSDK - needs DocsRenameWithDriveSDK because SDK rename updates cache (+ events)
DocsInvitationsDriveSDK - no dependencies
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

export function useTrashWithSDK() {
  return useFlag('DocsTrashWithDriveSDK') || isDevOrBlack()
}

export function useRenameWithSDK() {
  return useFlag('DocsRenameWithDriveSDK')
}

export function useMoveModalDriveSdkEnabled() {
  return useFlag('DocsMoveModalDriveSDK')
}

export function useInvitationsSdkEnabled() {
  return useFlag('DocsInvitationsDriveSDK') || isDevOrBlack()
}

export function useIsTableOfContentsEnabled() {
  return useFlag('DocsTableOfContents') || isDevOrBlack()
}

export function useIsOpenTracerEnabled() {
  return useFlag('DocsOpenTracer') || isDevOrBlack()
}

export function useIsGatePrivateInviteAccessEnabled() {
  return useFlag('DocsGatePrivateInviteAccess') || isDevOrBlack()
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
