import { useMemo } from 'react';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { UserAvatar } from '@proton/atoms/UserAvatar/UserAvatar';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';

import { useAlbumsStore } from '../../useAlbums.store';
import { getContactNameAndEmail } from '../getContactNameAndEmail';

interface AlbumMembersProps {
    onShare: () => void;
}

export const AlbumMembers = ({ onShare }: AlbumMembersProps) => {
    const members = useAlbumsStore((state) => {
        const uid = state.currentAlbumNodeUid;
        return uid ? (state.albums.get(uid)?.members ?? []) : [];
    });
    const [contactEmails] = useContactEmails();

    const membersWithName = useMemo(() => {
        return members.map((member) => {
            const { contactName, contactEmail } = getContactNameAndEmail(member.inviteeEmail, contactEmails);
            return { email: member.inviteeEmail, contactName, contactEmail };
        });
    }, [members, contactEmails]);

    const membersHeader = membersWithName.slice(0, 2);
    const membersModal = membersWithName.slice(2, -1);
    const hasPlusMembersAvatar = Boolean(membersModal && membersModal.length);

    return (
        <>
            {membersHeader.map((member, i) => (
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
