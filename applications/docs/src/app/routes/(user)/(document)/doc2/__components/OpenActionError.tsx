import { Button } from '@proton/atoms/Button/Button'
import { DOCS_SHORT_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { useNavigate } from 'react-router-dom-v5-compat'
import { c } from 'ttag'

import { HOMEPAGE_RECENTS_PATH } from '../../../__utils/homepage-paths'
import type { OpenResolution } from '../__utils/resolveOpenAction'
import { DocumentShell } from './DocumentShell'
import { ErrorHeader } from './ErrorHeader'

export type OpenActionErrorReason =
  | Extract<OpenResolution, { kind: 'error' }>['reason']
  | 'creationFailed'
  | 'bootstrapFailed'
  | 'unreadableUpdate'
  | 'editorFailed'

// Copied from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its `invalid_open_action` branch: the
// invalid URL and Slack messages, and the test id.
const messages: Record<OpenActionErrorReason, () => string> = {
  invalidUrl: () => c('Info').t`No document supplied in URL. Return to ${DRIVE_APP_NAME} and select a document.`,
  slackTruncated: () =>
    c('Info')
      .t`The URL you entered seems to have been copied from Slack incorrectly. When copying long links from Slack, right click the link, then choose "Copy link" rather than copying the truncated URL text directly.`,
  unsupported: () => c('Info').t`This link is not supported on this page.`,
  creationFailed: () => c('Info').t`The document could not be created.`,
  bootstrapFailed: () => c('Info').t`The document could not be loaded.`,
  unreadableUpdate: () => c('Info').t`Some of the document's content could not be read.`,
  editorFailed: () => c('Info').t`The editor could not be loaded.`,
}

export type OpenActionErrorProps = { reason: OpenActionErrorReason; onRetry?: () => void }

export function OpenActionError({ reason, onRetry }: OpenActionErrorProps) {
  const navigate = useNavigate()

  return (
    <DocumentShell header={<ErrorHeader />}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="max-w-prose text-center" data-testid="invalid-openaction-error">
          {messages[reason]()}
        </div>
        <div className="flex gap-2">
          {onRetry && <Button onClick={onRetry}>{c('Action').t`Try again`}</Button>}
          <Button color="norm" onClick={() => navigate(HOMEPAGE_RECENTS_PATH)}>
            {c('Action').t`Go to ${DOCS_SHORT_APP_NAME} home`}
          </Button>
        </div>
      </div>
    </DocumentShell>
  )
}
