import type { FC } from 'react';

import { useMaybeGroup } from '../../Groups/GroupsProvider';
import { MaybeGroupName } from '../../Groups/MaybeGroupName';

type Props = {
    email: string;
};

export const InviteGroupField: FC<Props> = ({ email }) => {
    const { maybeGroupProps, onShowMembers } = useMaybeGroup(email);

    return (
        // eslint-disable-next-line
        <div onClick={onShowMembers}>
            <MaybeGroupName {...maybeGroupProps} />
        </div>
    );
};
