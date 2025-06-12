import { useMemo } from 'react';

import { Avatar, Tooltip, UserAvatar } from '@proton/atoms';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';

import { getContactNameAndEmail } from '../../../components/modals/ShareLinkModal/DirectSharing/DirectSharingListing';
import { useShareMemberView } from '../../../store';

interface AlbumMembersProps {
    onShare: () => void;
    shareId: string;
    linkId: string;
}

export const AlbumMembers = ({ shareId, linkId, onShare }: AlbumMembersProps) => {
    const { members, invitations, externalInvitations } = useShareMemberView(shareId, linkId);
    const [contactEmails] = useContactEmails();
    const membersWithName = useMemo(() => {
        const emails = [
            ...members.map((member) => member.email),
            ...invitations.map((invitation) => invitation.inviteeEmail),
            ...externalInvitations.map((invitation) => invitation.inviteeEmail),
        ];

        return emails.map((email) => {
            const { contactName, contactEmail } = getContactNameAndEmail(email, contactEmails);
            return { email, contactName, contactEmail };
        });
    }, [members, invitations, externalInvitations, contactEmails]);
    const membersHeader = membersWithName.slice(0, 2);
    const membersModal = membersWithName.slice(2, -1);
    const hasPlusMembersAvatar = Boolean(membersModal && membersModal.length);

    return (
        <>
            {membersHeader &&
                membersHeader.map((member, i) => (
                    <Tooltip title={member.contactName || member.contactEmail || member.email} key={i}>
                        <UserAvatar name={member.contactName || member.contactEmail || member.email} />
                    </Tooltip>
                ))}
            {hasPlusMembersAvatar && (
                <Avatar color="weak" as="button" onClick={onShare}>{`+${membersModal.length}`}</Avatar>
            )}
        </>
    );
};
