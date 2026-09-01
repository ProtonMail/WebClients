import { useFlag } from '@proton/unleash/useFlag'
// Don't use: breaks mocking unleash in E2E tests
import { isDevOrBlack } from '@proton/shared/lib/env'

/*
SDK switch flags:
- DocsLoadRecentsWithDriveSDK - no dependencies
- DocsDocumentViewerEventsSDK - no dependencies
- DocsTrashWithDriveSDK - no dependencies
- DocsRenameWithDriveSDK - needs DocsLoadRecentsWithDriveSDK and DocsDocumentViewerEventsSDK for the events
- DocsSharingModalDriveSDK - needs DocsRenameWithDriveSDK for document title cache
- DocsMoveModalDriveSDK - needs DocsRenameWithDriveSDK because SDK rename updates cache (+ events)
- DocsInvitationsDriveSDK - no dependencies
- DocsDriveCompatSDK - no dependencies
*/

export function useSharingModalDriveSdkEnabled() {
  return useFlag('DocsSharingModalDriveSDK')
}

export function useLoadRecentsWithSdkEnabled() {
  return useFlag('DocsLoadRecentsWithDriveSDK')
}

export function useDocsDocumentViewerEventsSDK() {
  return useFlag('DocsDocumentViewerEventsSDK')
}

export function useTrashWithSDK() {
  return useFlag('DocsTrashWithDriveSDK')
}

export function useRenameWithSDK() {
  return useFlag('DocsRenameWithDriveSDK')
}

export function useMoveModalDriveSdkEnabled() {
  return useFlag('DocsMoveModalDriveSDK')
}

export function useInvitationsSdkEnabled() {
  return useFlag('DocsInvitationsDriveSDK')
}

export function useDriveCompatSDK() {
  return useFlag('DocsDriveCompatSDK')
}

// Other flags

export function useIsTableOfContentsEnabled() {
  return useFlag('DocsTableOfContents')
}

export function useIsOpenTracerEnabled() {
  return useFlag('DocsOpenTracer')
}

export function useIsGatePrivateInviteAccessEnabled() {
  return useFlag('DocsGatePrivateInviteAccess')
}

export function useIsDarkThemeEnabled() {
  return useFlag('DocsDarkTheme') || isDevOrBlack()
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
