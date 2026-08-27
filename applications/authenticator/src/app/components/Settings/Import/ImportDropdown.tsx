import type { FC } from 'react';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { ImportProviderValues } from '../../../../lib/importers/types';
import { useItemsActions } from '../../../providers/ItemActionsProvider';

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
