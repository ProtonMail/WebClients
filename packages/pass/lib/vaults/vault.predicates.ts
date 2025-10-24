import { PassCrypto } from '@proton/pass/lib/crypto';
import type { ShareItem } from '@proton/pass/store/reducers';
import { type Share, ShareRole, ShareType } from '@proton/pass/types';
import { and, not } from '@proton/pass/utils/fp/predicates';

export const isActiveVault = <T extends Share>(share: T): share is T & Share<ShareType.Vault> =>
    share.targetType === ShareType.Vault && PassCrypto.canOpenShare(share.shareId);

export const isWritableVault = <T extends Share>(share: T): share is T & Share<ShareType.Vault> =>
    share.targetType === ShareType.Vault && share.shareRoleId !== ShareRole.READ;

export const isOwnVault = <T extends Share>(share: T): share is T & Share<ShareType.Vault> =>
    share.targetType === ShareType.Vault && share.owner;

export const isSharedVault = <T extends Share>(share: T): share is T & Share<ShareType.Vault> =>
    share.targetType === ShareType.Vault && share.shared;

export const hasNewUserInvitesReady = (vault: ShareItem<ShareType.Vault>) => vault.newUserInvitesReady > 0;
export const isOwnReadonlyVault = and(not(isWritableVault), isOwnVault);
export const isOwnWritableVault = and(isWritableVault, isOwnVault);
export const isWritableSharedVault = and(isWritableVault, isSharedVault);
