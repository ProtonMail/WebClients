import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectAllTrashedItems } from '@proton/pass/store';

import { CountLabel } from '../Dropdown/CountLabel';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { getVaultOptionInfo } from './VaultSubmenu.utils';

type Props = {
    selected: boolean;
    handleTrashEmpty: () => void;
    handleTrashRestore: () => void;
    onSelect: () => void;
};

export const TrashItem: VFC<Props> = ({ selected, handleTrashRestore, handleTrashEmpty, onSelect }) => {
    const count = useSelector(selectAllTrashedItems).length;

    return (
        <DropdownMenuButton
            label={<CountLabel label={getVaultOptionInfo('trash').label} count={count} />}
            icon="trash"
            isSelected={selected}
            onClick={onSelect}
            quickActions={
                <>
                    <DropdownMenuButton
                        onClick={handleTrashRestore}
                        label={c('Label').t`Restore all items`}
                        icon="arrow-up-and-left"
                    />

                    <DropdownMenuButton
                        onClick={handleTrashEmpty}
                        label={c('Label').t`Empty trash`}
                        icon="trash-cross"
                        danger
                    />
                </>
            }
        />
    );
};
