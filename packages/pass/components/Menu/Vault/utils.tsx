import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcPassAllVaults } from '@proton/icons/icons/IcPassAllVaults';
import { IcPassTrash } from '@proton/icons/icons/IcPassTrash';
import { IcUserArrowLeft } from '@proton/icons/icons/IcUserArrowLeft';
import { IcUserArrowRight } from '@proton/icons/icons/IcUserArrowRight';

import type { VaultShareItem } from '../../../store/reducers';
import type { MaybeNull } from '../../../types';
import { VaultColor as VaultColorEnum, VaultIcon } from '../../../types/protobuf/vault-v1.static';
import { VAULT_ICON_MAP } from '../../Vault/constants';

export type VaultMenuOption = {
    id: MaybeNull<string>;
    label: string;
    color: VaultColorEnum;
    icon: IconComponent;
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
                icon: IcPassAllVaults,
            };
        case 'trash':
            return {
                id: null,
                label: c('Label').t`Trash`,
                icon: IcPassTrash,
                color: VaultColorEnum.COLOR_UNSPECIFIED,
            };
        case 'secure-links':
            return {
                id: null,
                label: c('Label').t`Secure links`,
                icon: IcLink,
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        case 'shared-by-me':
            return {
                id: null,
                label: c('Label').t`Shared by me`,
                icon: IcUserArrowRight,
                color: VaultColorEnum.COLOR_CUSTOM,
            };
        case 'shared-with-me':
            return {
                id: null,
                label: c('Label').t`Shared with me`,
                icon: IcUserArrowLeft,
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
