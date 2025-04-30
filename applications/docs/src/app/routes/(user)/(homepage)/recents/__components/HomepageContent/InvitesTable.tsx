import { Avatar, Button } from '@proton/atoms'
import { c } from 'ttag'
import { DateFormatter } from '@proton/docs-core'
import { Icon, Tooltip } from '@proton/components'
import { ServerTime } from '@proton/docs-shared'
import { useDocInvites } from '@proton/drive-store'
import * as Table from './table'
import { useState, type ComponentPropsWithoutRef } from 'react'
import { getInitials } from '@proton/shared/lib/helpers/string'
import { ContentSheet } from './shared'
import clsx from '@proton/utils/clsx'
import { useHomepageView } from '../../__utils/homepage-view'

const WAIT_AFTER_ACCEPT_INVITE = 5000 // ms
const MAX_INVITES_WHEN_COLLAPSED = 3

const dateFormatter = new DateFormatter()

export type InvitesTableProps = ComponentPropsWithoutRef<'div'>

export function InvitesTable(props: InvitesTableProps) {
  const { updateRecentDocuments } = useHomepageView()
  const { confirmModal, invitations, acceptInvite, rejectInvite, recentlyAcceptedInvites, openInvitedDocument } =
    useDocInvites()
  const [collapsed, setCollapsed] = useState(true)

  const allInvites = [...invitations, ...recentlyAcceptedInvites]
  const pendingCount = allInvites.filter((invite) => !recentlyAcceptedInvites.includes(invite)).length
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
        <Table.Head className="border-weak border-b">
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
            if (recentlyAcceptedInvites.includes(invite)) {
              return null
            }

            const actions = (
              <div className="flex flex-nowrap gap-[.625rem]">
                <Tooltip title={c('Action').t`Accept invitation`}>
                  <Button
                    size="medium"
                    icon
                    color="weak"
                    disabled={invite.isLocked}
                    onClick={async () => {
                      openInvitedDocument(invite)
                      await acceptInvite(invite)
                      setTimeout(updateRecentDocuments, WAIT_AFTER_ACCEPT_INVITE)
                    }}
                    aria-label={c('Action').t`Accept invitation to document`}
                    data-testid="accept-invite-button"
                  >
                    <Icon name="checkmark" />
                  </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Decline invitation`}>
                  <Button
                    size="medium"
                    icon
                    color="weak"
                    disabled={invite.isLocked}
                    onClick={() => rejectInvite(invite)}
                    aria-label={c('Action').t`Decline invitation to document`}
                    data-testid="reject-invite-button"
                  >
                    <Icon name="cross" />
                  </Button>
                </Tooltip>
              </div>
            )

            return (
              <Table.Row key={invite.invitation.invitationId} data-testid="invite-row">
                <Table.DataCell>
                  <span
                    className="flex flex-nowrap items-center justify-between gap-2"
                    title={invite.decryptedLinkName}
                  >
                    <span className="flex flex-nowrap items-center gap-3">
                      <Icon name="brand-proton-docs" size={5} className="shrink-0 text-[#34B8EE]" />
                      <span className="text-pre text-ellipsis" data-testid="invite-document-name">
                        {invite.decryptedLinkName}
                      </span>
                    </span>

                    <span className="-me-3 shrink-0 medium:hidden">{actions}</span>
                  </span>
                </Table.DataCell>
                <Table.DataCell target="large">
                  <div
                    data-testid="invite-shared-date"
                    className="text-ellipsis"
                    title={getRelativeDate(new ServerTime(invite.invitation.createTime).date)}
                  >
                    {getRelativeDate(new ServerTime(invite.invitation.createTime).date)}
                  </div>
                </Table.DataCell>
                <Table.DataCell target="medium">
                  <span className="flex flex-nowrap items-center gap-2">
                    <Avatar
                      color="weak"
                      className="min-w-custom max-w-custom max-h-custom bg-[--interaction-default-hover]"
                      style={{
                        '--min-w-custom': '28px',
                        '--max-w-custom': '28px',
                        '--max-h-custom': '28px',
                      }}
                    >
                      {getInitials(invite.invitation.inviterEmail)}
                    </Avatar>
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
                  {actions}
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
          <Icon name="chevron-down" size={4} className="shrink-0" />
          <span className="text-[.875rem]">{c('Action').t`View all ${pendingCount} invitations`}</span>
        </button>
      )}
      {confirmModal}
    </ContentSheet>
  )
}

type CollapseButtonProps = { collapse: () => void }

function CollapseButton({ collapse }: CollapseButtonProps) {
  return (
    <Tooltip title={c('Action').t`Collapse list`}>
      <Button
        icon
        onClick={collapse}
        aria-label={c('Action').t`Collapse list of pending invitations`}
        shape="ghost"
        className="ml-auto shrink-0 px-2"
      >
        <Icon name="arrow-to-center-horizontal" className="shrink-0 rotate-90" />
      </Button>
    </Tooltip>
  )
}

function getRelativeDate(date: Date): string {
  const text = dateFormatter.formatDateOrTimeIfToday(date, c('Info').t`Just now`)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
