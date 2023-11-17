import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { VAULT_COLOR_MAP } from '@proton/pass/components/Vault/constants';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { CountLabel } from '../../Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
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
            onClick={onSelect}
            className={clsx('pass-vault-submenu-vault-item rounded-lg', selected && 'selected')}
            parentClassName="w-full mx-1"
            style={{
                '--vault-icon-color': VAULT_COLOR_MAP[VaultColor.COLOR_UNSPECIFIED],
            }}
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
