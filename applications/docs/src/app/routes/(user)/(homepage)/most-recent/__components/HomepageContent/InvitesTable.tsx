import { Button } from '@proton/atoms/index'
import { c } from 'ttag'
import { DateFormatter } from '@proton/docs-core'
import clsx from '@proton/utils/clsx'
import { MimeIcon } from '@proton/components/index'
import { ServerTime } from '@proton/docs-shared'
import { useDocInvites } from '@proton/drive-store'
import { Cell, HeadingCell } from './table'

const dateFormatter = new DateFormatter()

export type InvitesTableProps = { className?: string }

export function InvitesTable({ className }: InvitesTableProps) {
  const { confirmModal, invitations, acceptInvite, rejectInvite, recentlyAcceptedInvites, openInvitedDocument } =
    useDocInvites()

  const allInvites = [...invitations, ...recentlyAcceptedInvites]
  if (!allInvites.length) {
    return null
  }

  return (
    <div
      data-testid="invites-table-container"
      className={clsx(
        'border-weak shadow-raised flex w-full flex-col overflow-auto rounded-xl border bg-gray50',
        className,
      )}
    >
      <table className="text-rg mb-0 w-full" style={{ borderSpacing: 0 }} data-testid="invites-table">
        <thead className="sticky left-0 top-0">
          <tr className="text-left">
            <HeadingCell data-testid="invite-column-name">{c('Info').t`Invite`}</HeadingCell>
            <HeadingCell data-testid="invite-column-date">{c('Info').t`Shared on`}</HeadingCell>
            <HeadingCell data-testid="invite-column-shared-by">{c('Info').t`Shared by`}</HeadingCell>
            <HeadingCell data-testid="invite-column-actions">
              <span className="px-2">{c('Info').t`Actions`}</span>
            </HeadingCell>
          </tr>
        </thead>
        <tbody>
          {allInvites.map((invite) => {
            const isRecentlyAccepted = recentlyAcceptedInvites.includes(invite)
            return (
              <tr key={invite.invitation.invitationId} data-testid="invite-row">
                <Cell>
                  <span className="flex items-center gap-3">
                    <MimeIcon name="proton-doc" size={5} />
                    <span className="text-pre flex-1 text-ellipsis" data-testid="invite-document-name">
                      {invite.decryptedLinkName}
                    </span>
                  </span>
                </Cell>
                <Cell>
                  <div className="text-capitalize" data-testid="invite-shared-date">
                    {dateFormatter.formatDate(new ServerTime(invite.invitation.createTime).date)}
                  </div>
                </Cell>
                <Cell>
                  <div className="color-weak" data-testid="invite-shared-by">
                    {invite.invitation.inviterEmail}
                  </div>
                </Cell>
                <Cell>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      color="norm"
                      shape="outline"
                      disabled={invite.isLocked}
                      onClick={() => (isRecentlyAccepted ? openInvitedDocument(invite) : acceptInvite(invite))}
                      data-testid={isRecentlyAccepted ? 'open-invite-button' : 'accept-invite-button'}
                    >
                      {isRecentlyAccepted ? c('Action').t`Open` : c('Action').t`Accept`}
                    </Button>
                    {!isRecentlyAccepted && (
                      <Button
                        size="small"
                        color="danger"
                        shape="outline"
                        disabled={invite.isLocked}
                        onClick={() => rejectInvite(invite)}
                        data-testid="reject-invite-button"
                      >
                        {c('Action').t`Decline`}
                      </Button>
                    )}
                  </div>
                </Cell>
              </tr>
            )
          })}
        </tbody>
      </table>
      {confirmModal}
    </div>
  )
}
