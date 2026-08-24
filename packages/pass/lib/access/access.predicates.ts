import type { ShareItem } from '../../store/reducers/shares';
import { ShareType } from '../../types';
import type { AccessItem } from './types';

export const isMemberLimitReached = (
    { targetMaxMembers }: ShareItem,
    { invites, members, newUserInvites }: AccessItem
) => invites.length + members.length + newUserInvites.length >= targetMaxMembers;

type TargetType = { targetType: ShareType };

export const isVaultTarget = <T extends TargetType>({ targetType }: T) => targetType === ShareType.Vault;
export const isItemTarget = <T extends TargetType>({ targetType }: T) => targetType === ShareType.Item;
