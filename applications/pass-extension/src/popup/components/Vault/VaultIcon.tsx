import type { VFC } from 'react';

import type { IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP, VAULT_ICON_MAP } from '../../components/Vault/constants';

import './VaultIcon.scss';

type Size = 'large' | 'medium' | 'small';

export type VaultIconName = VaultIconEnum | 'pass-all-vaults' | 'pass-trash';

type Props = {
    color?: VaultColorEnum;
    icon?: VaultIconName;
    size?: Size;
    className?: string;
};

const SIZE_MAP: { [key in Size]: IconSize } = {
    large: 20,
    medium: 16,
    small: 12,
};

export const VaultIcon: VFC<Props> = ({ icon = 'pass-all-vaults', color, size = 'large', className }) => (
    <span
        className={clsx([`pass-vault-icon ${size} rounded-xl relative`, className])}
        style={{ '--vault-icon-color': VAULT_COLOR_MAP[color ?? VaultColorEnum.COLOR1] }}
    >
        <Icon
            className="absolute-center"
            name={icon === 'pass-all-vaults' || icon === 'pass-trash' ? icon : VAULT_ICON_MAP[icon]}
            size={SIZE_MAP[size]}
        />
    </span>
);
