import type { VFC } from 'react';

import type { IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP, VAULT_ICON_MAP } from '../../components/Vault/constants';

import './VaultIcon.scss';

export type VaultIconName = VaultIconEnum | 'pass-all-vaults' | 'pass-trash';

type Props = {
    background?: boolean;
    className?: string;
    color?: VaultColorEnum;
    highlighted?: boolean;
    icon?: VaultIconName;
    size?: IconSize;
};

const rem = (px: number) => `${px / rootFontSize()}rem`;

export const VaultIcon: VFC<Props> = ({
    className,
    background,
    highlighted,
    size = 20,
    color,
    icon = 'pass-all-vaults',
}) => (
    <span
        className={clsx([
            `pass-vault-icon rounded-xl relative w-custom h-custom`,
            background && 'background',
            size >= 20 && 'rounded-full',
            className,
        ])}
        style={{
            '--vault-icon-color': highlighted
                ? 'var(--interaction-norm-contrast)'
                : VAULT_COLOR_MAP[color ?? VaultColorEnum.COLOR1],
            '--w-custom': rem(background ? size * 2 : size),
            '--h-custom': rem(background ? size * 2 : size),
        }}
    >
        <Icon
            className="absolute inset-center"
            name={icon === 'pass-all-vaults' || icon === 'pass-trash' ? icon : VAULT_ICON_MAP[icon]}
            size={size}
        />
    </span>
);
