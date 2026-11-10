import { ValidationError } from '@proton/drive/sdk'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'

/** Why a document could not be opened, by the Docs API's answer */
export type BootstrapFailure = 'noAccess' | 'notFound' | 'unreachable' | 'bootstrapFailed'

/**
 * Classifies what opening the document rejected with: a `DocsApiError` by its code and status, the code first, since
 * the Docs API answers most failures with a 422 and puts the reason in the code: a 422 with any other code, such as
 * `CommitIdOutOfSync`, is generic and can be retried. Drive's node is read first, and for a user without access
 * it fails with a `ValidationError` ("Item not found", the same answer as for a deleted node), which is no access, as
 * /doc reads it in `~/components/document/DocumentViewer/DocumentViewer.tsx`. Anything else is `bootstrapFailed`.
 */
export function classifyBootstrapError(error: unknown): BootstrapFailure {
  if (error instanceof ValidationError) {
    return 'noAccess'
  }
  if (!(error instanceof DocsApiError)) {
    return 'bootstrapFailed'
  }
  if (error.code === DocsApiErrorCode.InsufficientPermissions || error.status === 403) {
    return 'noAccess'
  }
  if (error.code === DocsApiErrorCode.InvalidID || error.status === 404) {
    return 'notFound'
  }
  if (error.status === undefined) {
    return 'unreachable'
  }
  return 'bootstrapFailed'
}

/** A retry can help only when the failure may pass: no access and not found stay as they are. */
export function isRetryableBootstrapFailure(failure: BootstrapFailure): boolean {
  return failure === 'unreachable' || failure === 'bootstrapFailed'
}
