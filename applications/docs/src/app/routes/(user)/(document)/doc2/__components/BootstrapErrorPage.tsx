import { Button } from '@proton/atoms/Button/Button'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { c } from 'ttag'

import { type BootstrapFailure, isRetryableBootstrapFailure } from '../__utils/classifyBootstrapError'
import { type DocumentError, DocumentErrorFallback } from './DocumentErrorFallback'
import { DocumentShell } from './DocumentShell'
import { ErrorHeader } from './ErrorHeader'

export type BootstrapErrorPageProps = { failure: BootstrapFailure; onRetry: () => void }

/**
 * A document that could not be opened, on /doc's error card: no access as /doc shows it, and the rest as /doc's
 * "Something went wrong", with Reload where a retry can help. Reload opens the document again.
 */
export function BootstrapErrorPage({ failure, onRetry }: BootstrapErrorPageProps) {
  const actionButton = isRetryableBootstrapFailure(failure) ? (
    <Button color="norm" shape="outline" onClick={onRetry}>
      {c('Action').t`Reload`}
    </Button>
  ) : null

  const errors: Record<BootstrapFailure, DocumentError> = {
    noAccess: { message: '', userUnderstandableMessage: false, code: DocsApiErrorCode.InsufficientPermissions },
    notFound: {
      message: c('Info').t`This document does not exist, or it was deleted.`,
      userUnderstandableMessage: true,
    },
    unreachable: { title: c('Title').t`Offline`, message: '', userUnderstandableMessage: false },
    bootstrapFailed: { message: '', userUnderstandableMessage: false },
  }

  return (
    <DocumentShell header={<ErrorHeader />}>
      <DocumentErrorFallback error={{ ...errors[failure], actionButton }} />
    </DocumentShell>
  )
}
