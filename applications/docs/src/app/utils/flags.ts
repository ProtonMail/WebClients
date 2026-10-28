import { useFlag } from '@proton/unleash/useFlag'
// Don't use: breaks mocking unleash in E2E tests
import { isDevOrBlack } from '@proton/shared/lib/env'

/*
SDK switch flags:
- DocsLoadRecentsWithDriveSDK - no dependencies
- DocsDocumentViewerEventsSDK - no dependencies
- DocsTrashWithDriveSDK - no dependencies
- DocsMoveModalDriveSDK - no dependencies
- DocsInvitationsDriveSDK - no dependencies
- DocsDriveCompatSDK - no dependencies

Other flags:
- DocsHomepageBulkTrash - requires DocsTrashWithDriveSDK
- DocsHomepageBulkMove - requires DocsHomepageBulkTrash (with DocsTrashWithDriveSDK), DocsMoveModalDriveSDK
  and DocsLoadRecentsWithDriveSDK.
  It also shows row actions on hover only, and gives a selection's row menu just Move and Move to trash.
*/

export function useLoadRecentsWithSdkEnabled() {
  return useFlag('DocsLoadRecentsWithDriveSDK')
}

export function useDocsDocumentViewerEventsSDK() {
  return useFlag('DocsDocumentViewerEventsSDK')
}

export function useTrashWithSDK() {
  return useFlag('DocsTrashWithDriveSDK')
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

export function useBulkTrashEnabled() {
  const bulk = useFlag('DocsHomepageBulkTrash')
  const trashWithSDK = useTrashWithSDK()
  return bulk && trashWithSDK
}

export function useBulkMoveEnabled() {
  const bulkMove = useFlag('DocsHomepageBulkMove')
  const bulkTrash = useBulkTrashEnabled()
  const moveModalDriveSdk = useMoveModalDriveSdkEnabled()
  const recentsWithSdk = useLoadRecentsWithSdkEnabled()
  return bulkMove && bulkTrash && moveModalDriveSdk && recentsWithSdk
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

export function useIsODTEnabled() {
  return useFlag('DocsODTEnabled') || isDevOrBlack()
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
  return !killswitch
}
