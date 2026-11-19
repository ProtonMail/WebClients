import { c, msgid } from 'ttag'

// Parameter names are part of the existing msgids, which translations match.
export function createInvitesTableMessages() {
  return {
    invitesTable: {
      pendingInvitations: c('Info').t`Pending invitations`,
      sharedOn: c('Info').t`Shared on`,
      sharedBy: c('Info').t`Shared by`,
      acceptDecline: c('Info').t`Accept/decline`,
      viewInvitations: (pendingCount: number) =>
        c('Action').ngettext(
          msgid`View ${pendingCount} invitation`,
          `View all ${pendingCount} invitations`,
          pendingCount,
        ),
      accept: c('Action').t`Accept invitation`,
      acceptLabel: c('Action').t`Accept invitation to document`,
      decline: c('Action').t`Decline invitation`,
      declineLabel: c('Action').t`Decline invitation to document`,
      collapse: c('Action').t`Collapse list`,
      collapseLabel: c('Action').t`Collapse list of pending invitations`,
      justNow: c('Info').t`Just now`,
    },
  }
}
