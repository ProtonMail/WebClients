import type { FC } from 'react';

import type { IconName, IconSize } from '@proton/components';
import { Icon } from '@proton/components';
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

export const VaultTag: FC<Props> = ({ title, shared = false, icon, color, count, iconSize = 3 }) => {
    return (
        <div
            className={clsx(
                'pass-vault-tag flex items-center text-sm gap-x-1 flex-nowrap lh100',
                shared && 'pass-vault-tag--shared'
            )}
            style={shared ? { '--vault-icon-color': VAULT_COLOR_MAP[color ?? VaultColor.COLOR1] } : undefined}
        >
            {<Icon className="shrink-0 mr-1" name={icon} size={iconSize} />}
            <span className="text-ellipsis">{title}</span>
            {shared && count && (
                <>
                    <span className="shrink-0">• {count}</span>
                    <Icon className="shrink-0" name="users" size={iconSize} />
                </>
            )}
        </div>
    );
};
