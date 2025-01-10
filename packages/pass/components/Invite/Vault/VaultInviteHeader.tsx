import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { SharedVaultItem } from '@proton/pass/components/Vault/SharedVaultItem';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { SelectedShare, ShareType } from '@proton/pass/types';

export const VaultInviteHeader: FC<SelectedShare> = ({ shareId }) => {
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    return (
        <div className={'flex justify-space-between items-center flex-nowrap mt-3 mb-6 gap-3'}>
            <SharedVaultItem shareId={shareId} name={vault.content.name} {...vault.content.display} />
        </div>
    );
};
