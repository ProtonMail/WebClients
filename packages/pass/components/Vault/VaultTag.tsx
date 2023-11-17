import type { VFC } from 'react';

import type { IconName, IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { VAULT_COLOR_MAP } from './constants';

import './VaultTag.scss';

type Props = {
    title: string;
    shared?: boolean;
    icon: IconName;
    color?: VaultColor;
    count?: number;
    iconSize?: IconSize;
};

export const VaultTag: VFC<Props> = ({ title, shared = false, icon, color, count, iconSize = 12 }) => {
    return (
        <div
            className={clsx(
                'pass-vault-tag flex items-center text-sm gap-x-2 flex-nowrap',
                shared && 'pass-vault-tag--shared'
            )}
            style={shared ? { '--vault-icon-color': VAULT_COLOR_MAP[color ?? VaultColor.COLOR1] } : undefined}
        >
            {<Icon className="flex-item-noshrink" name={icon} size={iconSize} />}
            <span className="text-ellipsis">{title}</span>
            {count !== undefined && count > 1 && <span className="flex-item-noshrink">• {count}</span>}
        </div>
    );
};
