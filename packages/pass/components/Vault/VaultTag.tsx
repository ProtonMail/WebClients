import type { FC } from 'react';

import type { IconName } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1.static';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP } from './constants';

import './VaultTag.scss';

type Props = {
    title: string;
    icon: IconName;
    color?: VaultColor;
    iconSize?: IconSize;
};

export const VaultTag: FC<Props> = ({ title, icon, color, iconSize = 3 }) => (
    <div
        className={clsx('pass-vault-tag flex items-center text-sm gap-x-1 flex-nowrap lh100')}
        style={{ '--vault-icon-color': `rgb(${VAULT_COLOR_MAP[color ?? VaultColor.COLOR1]})` }}
    >
        {<Icon className="shrink-0 mr-1" name={icon} size={iconSize} />}
        <span className="text-ellipsis">{title}</span>
    </div>
);
