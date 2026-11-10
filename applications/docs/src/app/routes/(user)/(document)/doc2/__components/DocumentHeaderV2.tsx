import { useConfig } from '@proton/app-context/useConfig'
import { Button } from '@proton/atoms/Button/Button'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import UserDropdown from '@proton/components/containers/heading/UserDropdown'
import { DocumentRole } from '@proton/docs-shared/Doc/DocumentRole'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle'
import { IcEye } from '@proton/icons/icons/IcEye'
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { ReactNode } from 'react'
import { c } from 'ttag'

import { PopoverPill } from '~/components/document/DocumentLayout/DocumentHeader/PopoverPill'
import { WorkspacePromoBanner } from '~/components/document/DocumentViewer/WorkspacePromoBanner'
import { getDocsReportContextLines } from '~/utils/report-context'

import { getWindowLocationExcludingDomain } from '../__utils/getWindowLocationExcludingDomain'
import { isParticipantLimitReached } from '../__utils/activeUsers'
import { DocumentActiveUsers, type DocumentActiveUsersProps } from './DocumentActiveUsers'
import { DocumentTitleMenu, type DocumentTitleMenuProps } from './DocumentTitleMenu'

export type DocumentHeaderV2Props = DocumentTitleMenuProps & {
  /** The session's status pills, next to the title where /doc shows its `ConnectionStatus` */
  status?: ReactNode
}

/**
 * /doc's header for a document (`DocsHeaderForDocument` in `DocumentHeader.tsx`): the Docs home link, the title menu,
 * the status pills, the view-only pill, the comments button and the user menu, under the workspace promo banner.
 */
export function DocumentHeaderV2(props: DocumentHeaderV2Props & ActiveUsersProps) {
  const { APP_VERSION, CLIENT_TYPE } = useConfig()
  const { role, status, ...titleMenuProps } = props

  return (
    <>
      <WorkspacePromoBanner />
      <div className="flex select-none flex-nowrap items-center gap-2 px-3 py-2" data-testid="docs-header">
        <div className="flex flex-1 flex-nowrap items-center head-480-749:!flex-none head-max-479:!basis-auto">
          <a className="flex-shrink-0" href={getAppHref('/', APPS.PROTONDOCS)} data-testid="docs-home-link">
            <MimeProtonDoc size={5} className="ml-[.75rem] mr-[.0625rem] shrink-0" />
          </a>
          <DocumentTitleMenu role={role} {...titleMenuProps} />
          <div
            className="flex-grow-1 flex-basis-0 ml-0.5 flex min-w-fit flex-shrink-0 items-center justify-between gap-2 head-max-1199:!max-w-[4.5rem]"
            data-testid="status-container"
          >
            {status}
            <div className="flex-none head-max-479:![display:none]">{role === 'Viewer' && <ViewOnlyPill />}</div>
            {isParticipantLimitReached(props.participants) && <LimitedAvailabilityPill />}
          </div>
        </div>

        <div className="flex flex-1 flex-nowrap items-center justify-end head-max-479:!flex-shrink-0 head-max-479:!basis-auto">
          <DocumentActiveUsers
            className="mr-2 hidden md:flex"
            participants={props.participants}
            editorInvoker={props.editorInvoker}
          />
          {role !== 'Viewer' && <CommentsButtonStub />}
          <div className="w-2" />
          <UserDropdown
            app={APPS.PROTONDOCS}
            reportDescriptionContext={getDocsReportContextLines({
              documentType: 'doc',
              role: new DocumentRole(role),
              appVersion: APP_VERSION,
              clientType: CLIENT_TYPE,
            })}
            sessionOptions={{ path: getWindowLocationExcludingDomain(), target: '_self' }}
          />
        </div>
      </div>
    </>
  )
}

/** The session's participants, for the active users and the participant limit */
type ActiveUsersProps = Pick<DocumentActiveUsersProps, 'participants' | 'editorInvoker'>

/** A stub until comments come to doc2, after the SDK's Phase 2: shown disabled, with a tooltip saying so. */
function CommentsButtonStub() {
  return (
    <Tooltip title={c('Info').t`Comments are not available yet`}>
      <span className="flex" data-testid="comments-button-stub">
        <Button
          icon
          shape="ghost"
          disabled
          data-testid="comments-button"
          className="flex items-center justify-center gap-2 head-max-849:!border head-max-849:!border-[--border-norm] head-max-849:!p-[0.5em]"
        >
          <IcSpeechBubble alt={c('Action').t`Comments`} />
        </Button>
      </span>
    </Tooltip>
  )
}

// Copied from `DocumentHeader.tsx`, which imports docs-core.
function ViewOnlyPill() {
  return (
    <PopoverPill
      placement="bottom"
      title={
        <div className="flex gap-2" data-testid="changes-info-e2e-encrypted">
          <IcEye className="h-6 w-6 fill-current" />
          <span>{c('Info').t`View only`}</span>
        </div>
      }
      content={c('Info')
        .t`You are currently viewing this document in view-only mode. Reach out to the owner to request access to edit and comment.`}
    >
      <IcEye className="h-4 w-4 fill-current" />
      <span className="head-max-1199:sr-only">{c('Info').t`View only`}</span>
    </PopoverPill>
  )
}

// Copied from `ConnectionStatus.tsx`, which imports docs-core.
function LimitedAvailabilityPill() {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2" data-testid="changes-info-limited">
          <IcExclamationCircle className="h-6 w-6 fill-current" />
          <span>{c('Title').t`Limited availability`}</span>
        </div>
      }
      content={c('Info').t`This document has lots of activity. Some features may be temporarily unavailable.`}
    >
      <IcExclamationCircle className="h-4 w-4 fill-current" />
      <span className="head-max-1199:!sr-only">{c('Info').t`Limited availability`}</span>
    </PopoverPill>
  )
}
