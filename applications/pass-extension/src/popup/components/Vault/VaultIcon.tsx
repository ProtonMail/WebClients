import type { VFC } from 'react';

import type { IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP, VAULT_ICON_MAP } from '../../components/Vault/constants';

import './VaultIcon.scss';

export type VaultIconName = VaultIconEnum | 'pass-all-vaults' | 'pass-trash';

type Props = {
    color?: VaultColorEnum;
    icon?: VaultIconName;
    size?: IconSize;
    background?: boolean;
    className?: string;
};

const rem = (px: number) => `${px / parseFloat(getComputedStyle(document.documentElement).fontSize)}rem`;

export const VaultIcon: VFC<Props> = ({ icon = 'pass-all-vaults', color, size = 20, background, className }) => (
    <span
        className={clsx([
            `pass-vault-icon rounded-xl relative w-custom h-custom`,
            background && 'background',
            size >= 32 && 'rounded-full',
            className,
        ])}
        style={{
            '--vault-icon-color': VAULT_COLOR_MAP[color ?? VaultColorEnum.COLOR1],
            '--w-custom': rem(background ? size * 2 : size),
            '--h-custom': rem(background ? size * 2 : size),
        }}
    >
        <Icon
            className="absolute-center"
            name={icon === 'pass-all-vaults' || icon === 'pass-trash' ? icon : VAULT_ICON_MAP[icon]}
            size={size}
        />
    </span>
);
