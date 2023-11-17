import type { VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { selectVaultItemsCount } from '@proton/pass/store/selectors';
import type { VaultColor, VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { VaultIcon } from './VaultIcon';

type SharedVaultItemProps = {
    className?: string;
    color?: VaultColor;
    icon?: VaultIconEnum;
    name: string;
    shareId?: string;
};

export const SharedVaultItem: VFC<SharedVaultItemProps> = ({
    className,
    color,
    icon,
    name,
    shareId = '',
}: SharedVaultItemProps) => {
    const count = useSelector(selectVaultItemsCount(shareId));

    return (
        <div className={clsx(['flex items-center gap-3', className])}>
            <VaultIcon color={color} icon={icon} size={20} background />
            <div className="flex-item-fluid">
                <div className="text-xl text-bold text-ellipsis">{name}</div>
                {count !== null && (
                    <span className="color-weak">
                        {c('Info').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </span>
                )}
            </div>
        </div>
    );
};
