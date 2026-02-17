import type { FC } from 'react';

import { GroupMembersModal, useGroupMembersModal } from '@proton/pass/components/Organization/Groups/GroupMembersModal';

type Props = {
    email: string;
};

export const InviteGroupField: FC<Props> = ({ email }) => {
    const { open, name, label, members, onClick, onClose } = useGroupMembersModal(email);

    return (
        // eslint-disable-next-line
        <div onClick={onClick}>
            {label}
            {open && <GroupMembersModal key="group-members-modal" name={name} members={members} onClose={onClose} />}
        </div>
    );
};
