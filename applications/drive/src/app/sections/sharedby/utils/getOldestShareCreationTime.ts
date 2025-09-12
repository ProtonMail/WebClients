import type { ShareResult } from '@proton/drive';

/**
 * Note: This is not ideal, but for now it's the only way to get that info,
 * Ideally we should display something different for directShare and public share.
 *
 * Finds the oldest creation time from all sharing types in a ShareResult.
 *
 * Checks creationTime from publicLink and invitationTime from all invitations and members
 * to determine when sharing was first initiated for a node.
 */
export const getOldestShareCreationTime = (shareResult: ShareResult): Date | undefined => {
    const creationTimes: Date[] = [];

    if (shareResult.publicLink) {
        creationTimes.push(shareResult.publicLink.creationTime);
    }

    shareResult.protonInvitations.forEach((invitation) => {
        creationTimes.push(invitation.invitationTime);
    });

    shareResult.nonProtonInvitations.forEach((invitation) => {
        creationTimes.push(invitation.invitationTime);
    });

    shareResult.members.forEach((member) => {
        creationTimes.push(member.invitationTime);
    });

    if (creationTimes.length === 0) {
        return undefined;
    }

    return new Date(Math.min(...creationTimes.map((date) => date.getTime())));
};
