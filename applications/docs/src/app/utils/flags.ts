import { useFlag } from '@proton/unleash/useFlag'
// Don't use: breaks mocking unleash in E2E tests
import { isDevOrBlack } from '@proton/shared/lib/env'

/*
SDK switch flags:
- DocsInvitationsDriveSDK - no dependencies
- DocsDriveCompatSDK - no dependencies
- DocsRealtimeSdkEnabled - no dependencies

Other flags:
- DocsHomepageBulkTrash - no dependencies
- DocsHomepageBulkMove - requires DocsHomepageBulkTrash.
  It also shows row actions on hover only, and gives a selection's row menu just Move and Move to trash.
*/

export function useInvitationsSdkEnabled() {
  return useFlag('DocsInvitationsDriveSDK')
}

export function useDriveCompatSDK() {
  return useFlag('DocsDriveCompatSDK')
}

export function useRealtimeSdkEnabled() {
  return useFlag('DocsRealtimeSdkEnabled')
}

// Other flags

export function useBulkTrashEnabled() {
  return useFlag('DocsHomepageBulkTrash')
}

export function useBulkMoveEnabled() {
  const bulkMove = useFlag('DocsHomepageBulkMove')
  const bulkTrash = useBulkTrashEnabled()
  return bulkMove && bulkTrash
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

// The homepage module (app/homepage) ignores this kill switch and always shows Sheets.
export function useIsSheetsEnabled() {
  const killswitch = useFlag('DocsSheetsDisabled')
  return !killswitch
}
