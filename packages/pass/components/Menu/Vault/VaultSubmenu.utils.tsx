import { c } from 'ttag';

import type { VaultShareItem } from '@proton/pass/store/reducers';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';

import { type VaultIconName } from '../../Vault/VaultIcon';

export type VaultOption = 'all' | 'trash' | VaultShareItem;

export const getVaultOptionInfo = (
    vault: VaultOption
): { id: null | string; label: string; path: string; color?: VaultColorEnum; icon?: VaultIconName } => {
    switch (vault) {
        case 'all':
            return { id: null, label: c('Label').t`All vaults`, path: '/', color: VaultColorEnum.COLOR_CUSTOM };
        case 'trash':
            return {
                id: null,
                label: c('Label').t`Trash`,
                path: '/trash',
                icon: 'pass-trash',
                color: VaultColorEnum.COLOR_UNSPECIFIED,
            };
        default:
            return {
                id: vault.shareId,
                label: vault.content.name,
                path: `/share/${vault.shareId}`,
                color: vault.content.display.color,
                icon: vault.content.display.icon,
            };
    }
};
