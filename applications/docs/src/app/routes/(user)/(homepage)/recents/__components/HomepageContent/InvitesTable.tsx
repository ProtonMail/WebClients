import { Avatar, Button } from '@proton/atoms'
import { c } from 'ttag'
import { DateFormatter } from '@proton/docs-core'
import { Icon, Tooltip } from '@proton/components'
import { ServerTime } from '@proton/docs-shared'
import { useDocInvites } from '@proton/drive-store'
import * as Table from './table'
import type { ComponentPropsWithoutRef } from 'react'
import { getInitials } from '@proton/shared/lib/helpers/string'
import { ContentSheet } from './shared'
import clsx from '@proton/utils/clsx'
import { useHomepageView } from '../../__utils/homepage-view'

const WAIT_AFTER_ACCEPT_INVITE = 5000 // ms

const dateFormatter = new DateFormatter()

export type InvitesTableProps = ComponentPropsWithoutRef<'div'>

export function InvitesTable(props: InvitesTableProps) {
  const { updateRecentDocuments } = useHomepageView()
  const { confirmModal, invitations, acceptInvite, rejectInvite, recentlyAcceptedInvites, openInvitedDocument } =
    useDocInvites()

  const allInvites = [...invitations, ...recentlyAcceptedInvites]
  const pendingCount = allInvites.filter((invite) => !recentlyAcceptedInvites.includes(invite)).length
  if (pendingCount === 0) {
    return null
  }

  return (
    <ContentSheet data-testid="invites-table-container" {...props} className={clsx('overflow-auto', props.className)}>
      <table className="mb-0 w-full table-fixed text-[14px]" data-testid="invites-table">
        <Table.Head>
          <Table.Header data-testid="invite-column-name">
            <span className="flex flex-nowrap items-center gap-[.375rem]">
              <span>{c('Info').t`Pending invitations`}</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-[.375rem] bg-[#0284C7]">
                <span className="text-[.75rem] leading-none text-[#ffffff]">{pendingCount}</span>
              </div>
            </span>
          </Table.Header>
          <Table.Header data-testid="invite-column-date">{c('Info').t`Shared on`}</Table.Header>
          <Table.Header data-testid="invite-column-shared-by">{c('Info').t`Shared by`}</Table.Header>
          <Table.Header data-testid="invite-column-actions">{c('Info').t`Accept/decline`}</Table.Header>
        </Table.Head>
        <tbody className="divide-y divide-[--border-weak] overflow-scroll">
          {allInvites.map((invite) => {
            if (recentlyAcceptedInvites.includes(invite)) {
              return null
            }
            return (
              <Table.Row key={invite.invitation.invitationId} data-testid="invite-row">
                <Table.DataCell>
                  <span className="flex flex-nowrap items-center gap-3">
                    <Icon name="brand-proton-docs" size={5} className="shrink-0 text-[#34B8EE]" />
                    <span className="text-pre text-ellipsis font-medium" data-testid="invite-document-name">
                      {invite.decryptedLinkName}
                    </span>
                  </span>
                </Table.DataCell>
                <Table.DataCell>
                  <div className="capitalize" data-testid="invite-shared-date">
                    {dateFormatter.formatDate(new ServerTime(invite.invitation.createTime).date)}
                  </div>
                </Table.DataCell>
                <Table.DataCell>
                  <span className="flex flex-nowrap items-center gap-2">
                    <Avatar
                      color="weak"
                      className="min-w-custom max-w-custom max-h-custom bg-[#F6F4F2]"
                      style={{
                        '--min-w-custom': '28px',
                        '--max-w-custom': '28px',
                        '--max-h-custom': '28px',
                      }}
                    >
                      {getInitials(invite.invitation.inviterEmail)}
                    </Avatar>
                    <span className="text-pre flex-1 text-ellipsis" data-testid="invite-shared-by">
                      {invite.invitation.inviterEmail}
                    </span>
                  </span>
                </Table.DataCell>
                <Table.DataCell>
                  <div className="flex flex-nowrap gap-[.625rem]">
                    <Tooltip title={c('Action').t`Accept invitation`}>
                      <Button
                        size="medium"
                        icon
                        color="weak"
                        disabled={invite.isLocked}
                        onClick={async () => {
                          await acceptInvite(invite)
                          openInvitedDocument(invite)
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
                </Table.DataCell>
              </Table.Row>
            )
          })}
        </tbody>
      </table>
      {confirmModal}
    </ContentSheet>
  )
}
