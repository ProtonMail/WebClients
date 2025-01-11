import { type FC, memo } from 'react';
import { useSelector } from 'react-redux';

import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectVaultItemsCount } from '@proton/pass/store/selectors';
import type { VaultColor, VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { VaultIcon } from './VaultIcon';

export type SharedVaultItemProps = {
    className?: string;
    color?: VaultColor;
    icon?: VaultIconEnum;
    name: string;
    shareId?: string;
};

export const SharedVaultItem: FC<SharedVaultItemProps> = memo(
    ({ className, color, icon, name, shareId = '' }: SharedVaultItemProps) => {
        const count = useSelector(selectVaultItemsCount(shareId));

        return (
            <div className={clsx(['flex items-center gap-3', className])}>
                <VaultIcon color={color} icon={icon} size={5} background />
                <div className="flex-1">
                    <div className="text-xl text-bold text-ellipsis">{name}</div>
                    {count !== null && <span className="color-weak">{formatItemsCount(count)}</span>}
                </div>
            </div>
        );
    }
);

SharedVaultItem.displayName = 'SharedVaultItemMemo';
