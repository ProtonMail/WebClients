import type { FC } from 'react';

import { useMaybeGroup } from '@proton/pass/components/Groups/GroupsProvider';

type Props = {
    email: string;
};

export const InviteGroupField: FC<Props> = ({ email }) => {
    const { name, onShowMembers } = useMaybeGroup(email);

    return (
        // eslint-disable-next-line
        <div onClick={onShowMembers}>{name}</div>
    );
};
