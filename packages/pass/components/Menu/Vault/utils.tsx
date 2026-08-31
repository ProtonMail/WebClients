import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';

import type { VaultShareItem } from '../../../store/reducers';
import type { MaybeNull } from '../../../types';
import { VaultColor as VaultColorEnum, VaultIcon } from '../../../types/protobuf/vault-v1.static';
import { VAULT_ICON_MAP } from '../../Vault/constants';

export type VaultMenuOption = {
    id: MaybeNull<string>;
    label: string;
    color: VaultColorEnum;
    icon: IconName;
};

export const getVaultOptionInfo = (
    vault: 'all' | 'trash' | 'shared-with-me' | 'shared-by-me' | 'secure-links' | VaultShareItem
): VaultMenuOption => {
    switch (vault) {
        case 'all':
            return {
                id: null,
                label: c('Label').t`All items`,
                color: VaultColorEnum.COLOR_CUSTOM,
                icon: 'pass-all-vaults',
            };
        case 'trash':
            return {
                id: null,
                label: c('Label').t`Trash`,
                icon: 'pass-trash',
                color: VaultColorEnum.COLOR_UNSPECIFIED,
            };
        case 'secure-links':
            return {
                id: null,
                label: c('Label').t`Secure links`,
                icon: 'link',
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        case 'shared-by-me':
            return {
                id: null,
                label: c('Label').t`Shared by me`,
                icon: 'user-arrow-right',
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        case 'shared-with-me':
            return {
                id: null,
                label: c('Label').t`Shared with me`,
                icon: 'user-arrow-left',
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        default:
            return {
                id: vault.shareId,
                label: vault.content.name,
                color: vault.content.display.color ?? VaultColorEnum.COLOR1,
                icon: VAULT_ICON_MAP[vault.content.display.icon ?? VaultIcon.ICON1],
            };
    }
};
