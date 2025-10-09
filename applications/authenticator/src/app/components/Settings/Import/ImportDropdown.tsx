import type { FC } from 'react';

import { useItemsActions } from 'proton-authenticator/app/providers/ItemActionsProvider';
import { ImportProviderValues } from 'proton-authenticator/lib/importers/types';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

export const ImportDropdown: FC = () => {
    const itemActions = useItemsActions();

    return (
        <DropdownMenu>
            {ImportProviderValues.map((label) => (
                <DropdownMenuButton key={label} onClick={() => itemActions.import(label)}>
                    {label}
                </DropdownMenuButton>
            ))}
        </DropdownMenu>
    );
};
