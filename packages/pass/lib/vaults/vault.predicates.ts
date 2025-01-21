import { PassCrypto } from '@proton/pass/lib/crypto';
import type { ShareItem } from '@proton/pass/store/reducers';
import { type Share, ShareRole, ShareType } from '@proton/pass/types';
import { and, not } from '@proton/pass/utils/fp/predicates';

export const isActiveVault = <T extends Share>({ targetType, shareId }: T) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

export const isWritableVault = <T extends Share>({ targetType, shareRoleId }: T) =>
    targetType === ShareType.Vault && shareRoleId !== ShareRole.READ;

export const isOwnVault = <T extends Share>({ targetType, owner }: T) => targetType === ShareType.Vault && owner;
export const isSharedVault = <T extends Share>({ targetType, shared }: T) => targetType === ShareType.Vault && shared;
export const hasNewUserInvitesReady = (vault: ShareItem<ShareType.Vault>) => vault.newUserInvitesReady > 0;
export const isOwnReadonlyVault = and(not(isWritableVault), isOwnVault);
export const isOwnWritableVault = and(isWritableVault, isOwnVault);
export const isWritableSharedVault = and(isWritableVault, isSharedVault);
