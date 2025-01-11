import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { InviteListItem } from '@proton/pass/components/Invite/Access/AccessList';
import { isMemberLimitReached } from '@proton/pass/lib/access/access.predicates';
import { isItemShare } from '@proton/pass/lib/shares/share.predicates';
import type { AccessItem, ShareItem } from '@proton/pass/store/reducers';
import { selectAccess, selectShareOrThrow } from '@proton/pass/store/selectors';
import { ShareType } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';

const parseShareAccess = (access: AccessItem, share: ShareItem) => {
    const { members, invites, newUserInvites } = access;
    const itemShare = isItemShare(share);

    const allInvites: InviteListItem[] = [
        ...invites.map((invite) => ({ key: invite.invitedEmail, type: 'existing' as const, invite })),
        ...newUserInvites.map((invite) => ({ key: invite.invitedEmail, type: 'new' as const, invite })),
    ].sort(sortOn('key', 'ASC'));

    const itemInvites = allInvites.filter(({ invite }) => invite.targetType === ShareType.Item);
    const itemMembers = members.filter((member) => itemShare || member.targetType === ShareType.Item);
    const itemAccessCount = itemInvites.length + itemMembers.length;

    /** When the share is an ItemShare all these values will
     * be empty as the share will only contain a single item */
    const vaultInvites = allInvites.filter(({ invite }) => !itemShare && invite.targetType === ShareType.Vault);
    const vaultMembers = members.filter((member) => !itemShare && member.targetType === ShareType.Vault);
    const vaultAccessCount = vaultInvites.length + vaultMembers.length;

    return {
        itemInvites,
        itemMembers,
        itemAccessCount,
        vaultInvites,
        vaultMembers,
        vaultAccessCount,
        limitReached: isMemberLimitReached(share, access),
    };
};

export const useShareAccess = (shareId: string, itemId?: string) => {
    const share = useSelector(selectShareOrThrow(shareId));
    const access = useSelector(selectAccess(shareId, itemId));
    return useMemo(() => parseShareAccess(access, share), [access, share]);
};
