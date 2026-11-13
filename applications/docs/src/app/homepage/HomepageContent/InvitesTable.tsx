import { Avatar } from '../components/atoms'
import { IcArrowToCenterHorizontal } from '@proton/icons/icons/IcArrowToCenterHorizontal'
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark'
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown'
import { IcCross } from '@proton/icons/icons/IcCross'
import type { DateFormatter } from '../utils/dateFormatter'
import { ServerTime } from '../utils/serverTime'
import { isProtonDocsDocument } from '../utils/mimetype'
import { getInitials } from './getInitials'
import { clsx } from '../utils/clsx'
import { type ComponentPropsWithoutRef, useState } from 'react'
import { c, msgid } from 'ttag'
import { useHomepageView } from '../homepageViewContext'
import { COLOR_BY_TYPE, ContentSheet, ICON_BY_TYPE } from './shared'
import * as Table from './table'
import type { AcceptInvitation, ExtendedInvitationDetails } from '../invitationTypes'
import { useOpenInvitedDocument } from './useOpenInvitedDocument'
import { TelemetryEvent } from '../utils/telemetry'
import { IconButton } from '../components/ui'

const MAX_INVITES_WHEN_COLLAPSED = 3
const WAIT_AFTER_ACCEPT_INVITE = 5000 // ms

export type InvitesTableProps = ComponentPropsWithoutRef<'div'>

export function InvitesTable(props: InvitesTableProps) {
  const { dateFormatter, pendingInvitations, recentlyAcceptedInvitations, acceptInvitation, declineInvitation } =
    useHomepageView()

  const openInvitedDocument = useOpenInvitedDocument()
  const [collapsed, setCollapsed] = useState(true)

  // The host keeps the accepted invitations until the reload button, so leave them out of the rows and of the collapse.
  // By ID: the pending list holds new objects for them once the store locks or refetches them.
  const acceptedIds = new Set(recentlyAcceptedInvitations.map(({ invitation }) => invitation.invitationId))
  const allInvites = pendingInvitations.filter(({ invitation }) => !acceptedIds.has(invitation.invitationId))
  const pendingCount = allInvites.length
  if (pendingCount === 0) {
    return null
  }

  const canCollapse = allInvites.length > MAX_INVITES_WHEN_COLLAPSED
  const collapseResolved = canCollapse && collapsed
  const expandedResolved = canCollapse && !collapsed

  const collapseButton = expandedResolved ? (
    <CollapseButton
      collapse={() => {
        setCollapsed(true)
        document.getElementById('invites-table-container')?.scrollIntoView()
      }}
    />
  ) : null

  const visibleInvites = collapseResolved ? allInvites.slice(0, MAX_INVITES_WHEN_COLLAPSED) : allInvites

  return (
    <ContentSheet
      id="invites-table-container"
      data-testid="invites-table-container"
      {...props}
      className={clsx('shrink-0', props.className)}
    >
      <Table.Table data-testid="invites-table">
        <Table.Head topLevelSticky className="border-weak border-b">
          <Table.Header isTitle data-testid="invite-column-name">
            <div className="flex w-full items-center justify-between">
              <span className="flex flex-nowrap items-center gap-[.375rem]">
                <span className="shrink-0">{c('Info').t`Pending invitations`}</span>
                <div className="flex h-5 !min-w-5 shrink-0 items-center justify-center rounded-[.375rem] bg-[#0284C7] px-1">
                  <span className="text-[.75rem] leading-none text-[#ffffff]">{pendingCount}</span>
                </div>
              </span>
              <span className="-me-3 medium:hidden">{collapseButton}</span>
            </div>
          </Table.Header>
          <Table.Header target="large" data-testid="invite-column-date">{c('Info').t`Shared on`}</Table.Header>
          <Table.Header target="medium" data-testid="invite-column-shared-by">{c('Info').t`Shared by`}</Table.Header>
          <Table.Header target="medium" data-testid="invite-column-actions">
            <div className="flex w-full flex-nowrap items-center justify-between">
              <span>{c('Info').t`Accept/decline`}</span>
              {collapseButton}
            </div>
          </Table.Header>
        </Table.Head>
        <Table.Body className="divide-weak divide-y">
          {visibleInvites.map((invite) => {
            const type = isProtonDocsDocument(invite.link.mimeType) ? 'document' : 'spreadsheet'
            const DocumentTypeIcon = ICON_BY_TYPE[type]

            return (
              <Table.Row key={invite.invitation.invitationId} data-testid="invite-row">
                <Table.DataCell>
                  <span
                    className="flex flex-nowrap items-center justify-between gap-2"
                    title={invite.decryptedLinkName}
                  >
                    <span className="flex flex-nowrap items-center gap-3">
                      <DocumentTypeIcon
                        size={5}
                        className="shrink-0 text-[--icon-color]"
                        style={{ '--icon-color': COLOR_BY_TYPE[type] }}
                      />
                      <span className="text-pre text-ellipsis" data-testid="invite-document-name">
                        {invite.decryptedLinkName}
                      </span>
                    </span>

                    <span className="-me-3 shrink-0 medium:hidden">
                      <InviteActions
                        invite={invite}
                        onRejectInvite={declineInvitation}
                        acceptInvite={acceptInvitation}
                        openInvitedDocument={openInvitedDocument}
                      />
                    </span>
                  </span>
                </Table.DataCell>
                <Table.DataCell target="large">
                  <div
                    data-testid="invite-shared-date"
                    className="text-ellipsis"
                    title={getRelativeDate(dateFormatter, new ServerTime(invite.invitation.createTime).date)}
                  >
                    {getRelativeDate(dateFormatter, new ServerTime(invite.invitation.createTime).date)}
                  </div>
                </Table.DataCell>
                <Table.DataCell target="medium">
                  <span className="flex flex-nowrap items-center gap-2 overflow-hidden">
                    <Avatar>{getInitials(invite.invitation.inviterEmail)}</Avatar>
                    <span
                      className="text-pre flex-1 text-ellipsis"
                      data-testid="invite-shared-by"
                      title={invite.invitation.inviterEmail}
                    >
                      {invite.invitation.inviterEmail}
                    </span>
                  </span>
                </Table.DataCell>
                <Table.DataCell target="medium" data-testid="invite-actions-cell">
                  <InviteActions
                    invite={invite}
                    onRejectInvite={declineInvitation}
                    acceptInvite={acceptInvitation}
                    openInvitedDocument={openInvitedDocument}
                  />
                </Table.DataCell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Table>
      {collapseResolved && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-[3.375rem] w-full items-center gap-3 px-6 text-[#0284C7]"
        >
          <IcChevronDown size={4} className="shrink-0" />
          <span className="text-[.875rem]">
            {c('Action').ngettext(
              msgid`View ${pendingCount} invitation`,
              `View all ${pendingCount} invitations`,
              pendingCount,
            )}
          </span>
        </button>
      )}
    </ContentSheet>
  )
}

interface InviteActionsProps {
  invite: ExtendedInvitationDetails
  onRejectInvite: (invite: ExtendedInvitationDetails) => void
  acceptInvite: AcceptInvitation
  openInvitedDocument: ReturnType<typeof useOpenInvitedDocument>
}

function InviteActions({ invite, onRejectInvite, acceptInvite, openInvitedDocument }: InviteActionsProps) {
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)

  const { updateRecentDocuments, reportTelemetry, logger, errorTracking } = useHomepageView()

  async function handleAcceptInvite(invite: ExtendedInvitationDetails) {
    try {
      setIsAcceptingInvite(true)
      await acceptInvite(invite)
      openInvitedDocument(invite)
      setTimeout(updateRecentDocuments, WAIT_AFTER_ACCEPT_INVITE)
      reportTelemetry(TelemetryEvent.invite_accepted)
    } catch (error) {
      logger.error('Could not accept invite')
      errorTracking.traceError(error)
    } finally {
      setIsAcceptingInvite(false)
    }
  }

  async function handleRejectInvite(invite: ExtendedInvitationDetails) {
    try {
      await onRejectInvite(invite)
      reportTelemetry(TelemetryEvent.invite_rejected)
    } catch (error) {
      logger.error('Could not reject invite')
      errorTracking.traceError(error)
    }
  }

  return (
    <div className="flex flex-nowrap gap-[.625rem]">
      <IconButton
        label={c('Action').t`Accept invitation`}
        shape="outline"
        disabled={invite.isLocked || isAcceptingInvite}
        loading={isAcceptingInvite}
        onClick={() => handleAcceptInvite(invite)}
        aria-label={c('Action').t`Accept invitation to document`}
        data-testid="accept-invite-button"
      >
        <IcCheckmark />
      </IconButton>
      <IconButton
        label={c('Action').t`Decline invitation`}
        shape="outline"
        disabled={invite.isLocked}
        onClick={() => handleRejectInvite(invite)}
        aria-label={c('Action').t`Decline invitation to document`}
        data-testid="reject-invite-button"
      >
        <IcCross />
      </IconButton>
    </div>
  )
}

type CollapseButtonProps = { collapse: () => void }

function CollapseButton({ collapse }: CollapseButtonProps) {
  return (
    <IconButton
      label={c('Action').t`Collapse list`}
      onClick={collapse}
      aria-label={c('Action').t`Collapse list of pending invitations`}
      shape="ghost"
      className="ml-auto shrink-0 px-2"
    >
      <IcArrowToCenterHorizontal className="shrink-0 rotate-90" />
    </IconButton>
  )
}

function getRelativeDate(dateFormatter: DateFormatter, date: Date): string {
  const text = dateFormatter.formatDateOrTimeIfToday(date, c('Info').t`Just now`)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
