import type { HomepageDependencies } from 'proton-docs/homepage';

import { mimeTypes } from './recents';

/** An invitation from `inviterEmail` to a file, sent just now, still pending. */
export type PendingInvitation = {
    invitationId: string;
    name: string;
    type: keyof typeof mimeTypes;
    inviterEmail: string;
};

/** Dependencies with `invitations` pending. */
export function invitationsDependencies(
    invitations: PendingInvitation[]
): Pick<HomepageDependencies, 'pendingInvitations'> {
    const createTime = Math.floor(Date.now() / 1000);
    return {
        pendingInvitations: invitations.map(({ invitationId, name, type, inviterEmail }) => ({
            invitation: {
                invitationId,
                inviterEmail,
                inviteeEmail: 'me@example.com',
                permissions: 0,
                keyPacket: '',
                keyPacketSignature: '',
                createTime,
                // Pending.
                state: 1,
            },
            share: {
                shareId: `share-${invitationId}`,
                volumeId: 'other-volume',
                passphrase: '',
                shareKey: '',
                creatorEmail: inviterEmail,
            },
            // A file.
            link: { linkId: `link-${invitationId}`, name, mimeType: mimeTypes[type], isFile: true, type: 2 },
            decryptedLinkName: name,
        })),
    };
}
