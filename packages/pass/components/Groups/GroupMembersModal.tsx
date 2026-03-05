import type { FC } from 'react';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { ShareMemberAvatar } from '@proton/pass/components/Invite/Member/ShareMemberAvatar';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { GroupMember } from '@proton/pass/lib/groups/groups.types';
import { truthy } from '@proton/pass/utils/fp/predicates';

type ModalProps = { name: string; members: GroupMember[]; onClose: () => void };

export const GroupMembersModal: FC<ModalProps> = ({ name, members, onClose }) => {
    const emails = members.map(({ email }) => email).filter(truthy);

    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalHeader title={name} />
            <ModalContent className="flex flex-col gap-4 py-4">
                {emails.map((email, index) => (
                    <div key={index} className="flex flex-nowrap items-center w-full">
                        <ShareMemberAvatar email={email} isGroup={false} />
                        <div className="text-ellipsis">{email}</div>
                    </div>
                ))}
            </ModalContent>
        </PassModal>
    );
};
