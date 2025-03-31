import { useMemo } from 'react';

import { Avatar, UserAvatar } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import { useContactEmails } from '@proton/mail/contactEmails/hooks';

import { getContactNameAndEmail } from '../../../components/modals/ShareLinkModal/DirectSharing/DirectSharingListing';
import { useShareMemberView } from '../../../store';

interface AlbumMembersProps {
    onShare: () => void;
    shareId: string;
    linkId: string;
}

export const AlbumMembers = ({ shareId, linkId, onShare }: AlbumMembersProps) => {
    const { members } = useShareMemberView(shareId, linkId);
    const [contactEmails] = useContactEmails();
    const membersWithName = useMemo(
        () =>
            members.map((member) => {
                const { contactName, contactEmail } = getContactNameAndEmail(member.email, contactEmails);
                return { member, contactName, contactEmail };
            }),
        [members, contactEmails]
    );
    const membersHeader = membersWithName.slice(0, 2);
    const membersModal = membersWithName.slice(2, -1);
    const hasPlusMembersAvatar = Boolean(membersModal && membersModal.length);

    return (
        <>
            {membersHeader &&
                membersHeader.map((member, i) => (
                    <Tooltip
                        title={member.contactName || member.contactEmail || member.member.email}
                        key={member.member.memberId + i}
                    >
                        <UserAvatar name={member.contactName || member.contactEmail || member.member.email} />
                    </Tooltip>
                ))}
            {hasPlusMembersAvatar && (
                <Avatar color="weak" as="button" onClick={onShare}>{`+${membersModal.length}`}</Avatar>
            )}
        </>
    );
};
