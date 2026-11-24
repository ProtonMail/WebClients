import { Avatar } from '../components/atoms'
import type { DateFormatter } from '../utils/dateFormatter'
import { ServerTime } from '../utils/serverTime'
import { isProtonDocsDocument } from '../utils/mimetype'
import { getInitials } from './getInitials'
import { clsx } from '../utils/clsx'
import { type ComponentPropsWithoutRef, useState } from 'react'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import type { HomepageMessages } from '../messages/defaultHomepageMessages'
import { useHomepageView } from '../homepageViewContext'
import { COLOR_BY_TYPE, ContentSheet, ICON_BY_TYPE } from './shared'
import { Icon } from '../components/Icon'
import * as Icons from '../components/icons'
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
  const messages = useHomepageMessages().invitesTable
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
        <Table.Head topLevelSticky className="border-b border-[--border-weak]">
          <Table.Header isTitle data-testid="invite-column-name">
            <div className="flex w-full items-center justify-between">
              <span className="flex flex-nowrap items-center gap-[.375rem]">
                <span className="shrink-0">{messages.pendingInvitations}</span>
                <div className="flex h-5 !min-w-5 shrink-0 items-center justify-center rounded-[.375rem] bg-[#0284C7] px-1">
                  <span className="text-[.75rem] leading-none text-[#ffffff]">{pendingCount}</span>
                </div>
              </span>
              <span className="-me-3 medium:hidden">{collapseButton}</span>
            </div>
          </Table.Header>
          <Table.Header target="large" data-testid="invite-column-date">
            {messages.sharedOn}
          </Table.Header>
          <Table.Header target="medium" data-testid="invite-column-shared-by">
            {messages.sharedBy}
          </Table.Header>
          <Table.Header target="medium" data-testid="invite-column-actions">
            <div className="flex w-full flex-nowrap items-center justify-between">
              <span>{messages.acceptDecline}</span>
              {collapseButton}
            </div>
          </Table.Header>
        </Table.Head>
        <Table.Body className="divide-y divide-[--border-weak]">
          {visibleInvites.map((invite) => {
            const type = isProtonDocsDocument(invite.link.mimeType) ? 'document' : 'spreadsheet'

            return (
              <Table.Row key={invite.invitation.invitationId} data-testid="invite-row">
                <Table.DataCell>
                  <span
                    className="flex flex-nowrap items-center justify-between gap-2"
                    title={invite.decryptedLinkName}
                  >
                    <span className="flex flex-nowrap items-center gap-3">
                      <Icon
                        data={ICON_BY_TYPE[type]}
                        size={5}
                        className="shrink-0 text-[--icon-color]"
                        style={{ '--icon-color': COLOR_BY_TYPE[type] }}
                      />
                      <span className="text-ellipsis !whitespace-pre" data-testid="invite-document-name">
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
                    title={getRelativeDate(dateFormatter, new ServerTime(invite.invitation.createTime).date, messages)}
                  >
                    {getRelativeDate(dateFormatter, new ServerTime(invite.invitation.createTime).date, messages)}
                  </div>
                </Table.DataCell>
                <Table.DataCell target="medium">
                  <span className="flex flex-nowrap items-center gap-2 overflow-hidden">
                    <Avatar>{getInitials(invite.invitation.inviterEmail)}</Avatar>
                    <span
                      className="flex-1 text-ellipsis !whitespace-pre"
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
          <Icon data={Icons.chevronDown} className="shrink-0" />
          <span className="text-[.875rem]">{messages.viewInvitations(pendingCount)}</span>
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
  const messages = useHomepageMessages().invitesTable

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
        label={messages.accept}
        shape="outline"
        disabled={invite.isLocked || isAcceptingInvite}
        loading={isAcceptingInvite}
        onClick={() => handleAcceptInvite(invite)}
        aria-label={messages.acceptLabel}
        data-testid="accept-invite-button"
      >
        <Icon data={Icons.checkmark} />
      </IconButton>
      <IconButton
        label={messages.decline}
        shape="outline"
        disabled={invite.isLocked}
        onClick={() => handleRejectInvite(invite)}
        aria-label={messages.declineLabel}
        data-testid="reject-invite-button"
      >
        <Icon data={Icons.cross} />
      </IconButton>
    </div>
  )
}

type CollapseButtonProps = { collapse: () => void }

function CollapseButton({ collapse }: CollapseButtonProps) {
  const messages = useHomepageMessages().invitesTable
  return (
    <IconButton
      label={messages.collapse}
      onClick={collapse}
      aria-label={messages.collapseLabel}
      shape="ghost"
      className="ml-auto shrink-0 px-2"
    >
      <Icon data={Icons.arrowToCenterHorizontal} className="shrink-0 rotate-90" />
    </IconButton>
  )
}

function getRelativeDate(dateFormatter: DateFormatter, date: Date, messages: HomepageMessages['invitesTable']): string {
  const text = dateFormatter.formatDateOrTimeIfToday(date, messages.justNow)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
