import { PassCrypto } from '@proton/pass/lib/crypto';
import type { ShareItem } from '@proton/pass/store/reducers';
import { type Share, ShareRole, ShareType } from '@proton/pass/types';

export const isActiveVault = <T extends Share>({ targetType, shareId }: T) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

export const isWritableVault = <T extends Share>({ targetType, shareRoleId }: T) =>
    targetType === ShareType.Vault && shareRoleId !== ShareRole.READ;

export const isOwnVault = <T extends Share>({ targetType, owner }: T) => targetType === ShareType.Vault && owner;

export const isSharedVault = <T extends Share>({ targetType, shared }: T) => targetType === ShareType.Vault && shared;

export const isVaultMemberLimitReached = ({
    targetMaxMembers,
    invites = [],
    members = [],
    newUserInvites = [],
}: ShareItem) => invites.length + members.length + newUserInvites.length >= targetMaxMembers;

export const hasNewUserInvitesReady = (vault: ShareItem<ShareType.Vault>) => vault.newUserInvitesReady > 0;
