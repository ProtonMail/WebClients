import { PassCrypto } from '@proton/pass/lib/crypto';
import type { Share } from '@proton/pass/types';
import { ShareRole, ShareType } from '@proton/pass/types';

export const isActiveVault = <T extends Share>({ targetType, shareId }: T) =>
    targetType === ShareType.Vault && PassCrypto.canOpenShare(shareId);

export const isPrimaryVault = <T extends Share>({ targetType, primary }: T) =>
    targetType === ShareType.Vault && primary;

export const isWritableVault = <T extends Share>({ targetType, shareRoleId }: T) =>
    targetType === ShareType.Vault && shareRoleId !== ShareRole.READ;

export const isOwnVault = <T extends Share>({ targetType, owner }: T) => targetType === ShareType.Vault && owner;
