import { Button } from '@proton/atoms/index'
import { c } from 'ttag'
import { HomepageRecentDocumentsTableHeadingCell } from './HomepageRecentDocumentsTableHeadingCell'
import { HomepageRecentDocumentsTableCell } from './HomepageRecentDocumentsTableCell'
import { DateFormatter } from '@proton/docs-core'
import clsx from '@proton/utils/clsx'
import { MimeIcon } from '@proton/components/index'
import { ServerTime } from '@proton/docs-shared'
import { useDocInvites } from '@proton/drive-store'

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
            <HomepageRecentDocumentsTableHeadingCell data-testid="invite-column-name">
              {c('Info').t`Invite`}
            </HomepageRecentDocumentsTableHeadingCell>
            <HomepageRecentDocumentsTableHeadingCell data-testid="invite-column-date">
              {c('Info').t`Shared on`}
            </HomepageRecentDocumentsTableHeadingCell>
            <HomepageRecentDocumentsTableHeadingCell data-testid="invite-column-shared-by">
              {c('Info').t`Shared by`}
            </HomepageRecentDocumentsTableHeadingCell>
            <HomepageRecentDocumentsTableHeadingCell data-testid="invite-column-actions">
              <span className="px-2">{c('Info').t`Actions`}</span>
            </HomepageRecentDocumentsTableHeadingCell>
          </tr>
        </thead>
        <tbody>
          {allInvites.map((invite) => {
            const isRecentlyAccepted = recentlyAcceptedInvites.includes(invite)
            return (
              <tr key={invite.invitation.invitationId} data-testid="invite-row">
                <HomepageRecentDocumentsTableCell>
                  <span className="flex items-center gap-3">
                    <MimeIcon name="proton-doc" size={5} />
                    <span className="text-pre flex-1 text-ellipsis" data-testid="invite-document-name">
                      {invite.decryptedLinkName}
                    </span>
                  </span>
                </HomepageRecentDocumentsTableCell>
                <HomepageRecentDocumentsTableCell>
                  <div className="text-capitalize" data-testid="invite-shared-date">
                    {dateFormatter.formatDate(new ServerTime(invite.invitation.createTime).date)}
                  </div>
                </HomepageRecentDocumentsTableCell>
                <HomepageRecentDocumentsTableCell>
                  <div className="color-weak" data-testid="invite-shared-by">
                    {invite.invitation.inviterEmail}
                  </div>
                </HomepageRecentDocumentsTableCell>
                <HomepageRecentDocumentsTableCell>
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
                </HomepageRecentDocumentsTableCell>
              </tr>
            )
          })}
        </tbody>
      </table>
      {confirmModal}
    </div>
  )
}
