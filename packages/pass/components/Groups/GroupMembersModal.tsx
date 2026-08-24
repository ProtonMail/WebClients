import type { FC } from 'react';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

import type { GroupMember } from '../../lib/groups/groups.types';
import { truthy } from '../../utils/fp/predicates';
import { ShareMemberAvatar } from '../Invite/Member/ShareMemberAvatar';
import { PassModal } from '../Layout/Modal/PassModal';

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
