import type { FC } from 'react';

import type { IconName } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import { getIconSizePx } from '@proton/pass/components/Layout/Icon/IconBox';
import { VAULT_COLOR_MAP, VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1.static';
import { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1.static';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import './VaultIcon.scss';

export type VaultIconName = VaultIconEnum | IconName;

type Props = {
    background?: boolean;
    className?: string;
    color?: VaultColorEnum;
    highlighted?: boolean;
    icon?: VaultIconName;
    size?: IconSize;
};

const rem = (px: number) => `${px / rootFontSize()}rem`;

export const VaultIcon: FC<Props> = ({
    className,
    background,
    highlighted,
    size = 5,
    color,
    icon = 'pass-all-vaults',
}) => {
    const iconName = typeof icon === 'number' ? VAULT_ICON_MAP[icon] : icon;

    return (
        <span
            className={clsx([
                `pass-vault-icon rounded-xl relative w-custom h-custom`,
                background && 'background',
                size >= 5 && 'rounded-full',
                className,
            ])}
            style={{
                '--vault-icon-color': highlighted
                    ? 'var(--interaction-norm-contrast)'
                    : `rgb(${VAULT_COLOR_MAP[color ?? VaultColorEnum.COLOR1]})`,
                '--w-custom': rem(getIconSizePx(background ? size * 2 : size)),
                '--h-custom': rem(getIconSizePx(background ? size * 2 : size)),
            }}
        >
            <Icon className="absolute inset-center" name={iconName} size={size} />
        </span>
    );
};
