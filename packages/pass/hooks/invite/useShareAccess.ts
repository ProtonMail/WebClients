import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { InviteListItem } from '../../components/Invite/Access/AccessList';
import { isMemberLimitReached } from '../../lib/access/access.predicates';
import type { AccessItem } from '../../lib/access/types';
import type { ShareItem } from '../../store/reducers';
import { selectAccess, selectShareOrThrow } from '../../store/selectors';
import { sortOn } from '../../utils/fp/sort';

const parseShareAccess = (access: AccessItem, share: ShareItem) => {
    const limitReached = isMemberLimitReached(share, access);

    const invites: InviteListItem[] = [
        ...access.invites.map((invite) => ({ key: invite.invitedEmail, type: 'existing' as const, invite })),
        ...access.newUserInvites.map((invite) => ({ key: invite.invitedEmail, type: 'new' as const, invite })),
    ].sort(sortOn('key', 'ASC'));

    return {
        invites,
        members: access.members.slice().sort(sortOn('email', 'ASC')),
        count: access.members.length + invites.length,
        limitReached,
    };
};

export const useShareAccess = (shareId: string, itemId?: string) => {
    const share = useSelector(selectShareOrThrow(shareId));
    const access = useSelector(selectAccess(shareId, itemId));
    return useMemo(() => parseShareAccess(access, share), [access, share]);
};
