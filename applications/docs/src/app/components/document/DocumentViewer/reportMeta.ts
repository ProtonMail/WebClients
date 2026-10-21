import type { EditorControllerInterface } from '@proton/docs-core'
import { promiseWithTimeout } from '@proton/shared/lib/helpers/promise'

/**
 * An editor deployed before `getEditorBuildInfo` existed never replies to it, which would otherwise
 * leave the debug info zip waiting forever.
 */
export const EDITOR_BUILD_INFO_TIMEOUT_MS = 2000

export interface BuildInfo {
  appVersion: string
  commit: string
}

/**
 * Lets tooling check out the code that produced a debug info zip. The client and the editor are deployed
 * separately, so each records its own build. Holds no user data.
 */
export interface ReportMeta {
  docsVersion: string | null
  docsCommit: string | null
  editorVersion: string | null
  editorCommit: string | null
}

export async function getReportMeta(
  docsBuildInfo: BuildInfo,
  editorController: Pick<EditorControllerInterface, 'getEditorBuildInfo'>,
): Promise<ReportMeta> {
  const editorBuildInfo = await getEditorBuildInfoOrNull(editorController)
  return {
    docsVersion: docsBuildInfo.appVersion || null,
    docsCommit: docsBuildInfo.commit || null,
    editorVersion: editorBuildInfo?.appVersion || null,
    editorCommit: editorBuildInfo?.commit || null,
  }
}

async function getEditorBuildInfoOrNull(
  editorController: Pick<EditorControllerInterface, 'getEditorBuildInfo'>,
): Promise<BuildInfo | null> {
  try {
    return await promiseWithTimeout({
      promise: editorController.getEditorBuildInfo(),
      timeoutMs: EDITOR_BUILD_INFO_TIMEOUT_MS,
    })
  } catch {
    return null
  }
}
