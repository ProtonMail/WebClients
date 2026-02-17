import type { FC, MouseEvent } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { ShareMemberAvatar } from '@proton/pass/components/Invite/Member/ShareMemberAvatar';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useGroupMembers } from '@proton/pass/hooks/groups/useGroupMembers';
import { useMemberOrGroupName } from '@proton/pass/hooks/groups/useMemberOrGroupName';
import type { MaybeNull } from '@proton/pass/types';

type ModalProps = { name: string; members: MaybeNull<string[]>; onClose: () => void };

export const GroupMembersModal: FC<ModalProps> = ({ name, members, onClose }) => {
    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalHeader title={name} />
            <ModalContent className="flex flex-col gap-4 py-4">
                {(members || []).map((email, index) => (
                    <div key={index} className="flex flex-nowrap items-center w-full">
                        <ShareMemberAvatar value={email.toUpperCase().slice(0, 2) ?? ''} />
                        <div className="text-ellipsis">{email}</div>
                    </div>
                ))}
            </ModalContent>
        </PassModal>
    );
};

export const useGroupMembersModal = (email: string, isGroupShare?: boolean) => {
    const [open, setOpen] = useState(false);
    const { isGroup, groupId, name, avatar } = useMemberOrGroupName(email, isGroupShare);
    const { loading, members } = useGroupMembers(groupId);
    const membersCount = members?.length;
    let label = name;
    if (membersCount !== undefined) {
        label += ' ' + c('Info').ngettext(msgid`(${membersCount} member)`, `(${membersCount} members)`, membersCount);
    }

    return {
        open: isGroup && !!groupId && !loading && !!membersCount && membersCount > 0 && open,
        onClick: (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(!open);
        },
        onClose: () => setOpen(false),
        isGroup,
        groupId,
        name,
        label,
        avatar,
        members,
        membersCount,
    };
};
