import { c } from 'ttag';

import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';

import { type VaultIconName } from '../../Vault/VaultIcon';

export type VaultMenuOption = {
    id: MaybeNull<string>;
    label: string;
    color?: VaultColorEnum;
    icon?: VaultIconName;
};

export const getVaultOptionInfo = (vault: 'all' | 'trash' | VaultShareItem): VaultMenuOption => {
    switch (vault) {
        case 'all':
            return {
                id: null,
                label: c('Label').t`All items`,
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        case 'trash':
            return {
                id: null,
                label: c('Label').t`Trash`,
                icon: 'pass-trash',
                color: VaultColorEnum.COLOR_UNSPECIFIED,
            };
        default:
            return {
                id: vault.shareId,
                label: vault.content.name,
                color: vault.content.display.color,
                icon: vault.content.display.icon,
            };
    }
};
