export const invitesTableMessages = {
  invitesTable: {
    pendingInvitations: 'Pending invitations',
    sharedOn: 'Shared on',
    sharedBy: 'Shared by',
    acceptDecline: 'Accept/decline',
    viewInvitations: (pendingCount: number) =>
      pendingCount === 1 ? `View ${pendingCount} invitation` : `View all ${pendingCount} invitations`,
    accept: 'Accept invitation',
    acceptLabel: 'Accept invitation to document',
    decline: 'Decline invitation',
    declineLabel: 'Decline invitation to document',
    collapse: 'Collapse list',
    collapseLabel: 'Collapse list of pending invitations',
    justNow: 'Just now',
  },
}
