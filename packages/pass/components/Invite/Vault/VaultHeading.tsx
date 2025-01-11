import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectShareOrThrow, selectVaultItemsCount } from '@proton/pass/store/selectors';
import type { SelectedShare, ShareType } from '@proton/pass/types';

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
