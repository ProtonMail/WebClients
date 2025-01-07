import type { AccessItem } from '@proton/pass/store/reducers/access';
import type { ShareItem } from '@proton/pass/store/reducers/shares';

export const isMemberLimitReached = (
    { targetMaxMembers }: ShareItem,
    { invites, members, newUserInvites }: AccessItem
) => invites.length + members.length + newUserInvites.length >= targetMaxMembers;
