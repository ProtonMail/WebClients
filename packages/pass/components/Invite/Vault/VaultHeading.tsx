import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { formatItemsCount } from '../../../lib/items/item.utils';
import { selectShareOrThrow, selectVaultItemsCount } from '../../../store/selectors';
import type { SelectedShare, ShareType } from '../../../types';
import { VaultIcon } from '../../Vault/VaultIcon';

export const VaultHeading: FC<SelectedShare> = ({ shareId }) => {
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const count = useSelector(selectVaultItemsCount(shareId)) ?? 0;

    return (
        <div className="flex gap-3 flex-nowrap items-center py-3 w-full">
            <VaultIcon color={vault.content.display.color} icon={vault.content.display.icon} size={4} background />
            <div className="text-left flex-1">
                <div className="text-ellipsis">{vault.content.name}</div>
                <div className="block color-weak text-sm text-ellipsis">{formatItemsCount(count)}</div>
            </div>
        </div>
    );
};
