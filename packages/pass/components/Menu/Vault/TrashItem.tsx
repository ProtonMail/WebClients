import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { VAULT_COLOR_MAP } from '@proton/pass/components/Vault/constants';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { CountLabel } from '../../Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { getVaultOptionInfo } from './utils';

type Props = {
    dense?: boolean;
    selected: boolean;
    handleTrashEmpty: () => void;
    handleTrashRestore: () => void;
    onSelect: () => void;
};

export const TrashItem: VFC<Props> = ({ dense, selected, handleTrashRestore, handleTrashEmpty, onSelect }) => {
    const count = useSelector(selectAllTrashedItems).length;

    return (
        <DropdownMenuButton
            label={<CountLabel label={getVaultOptionInfo('trash').label} count={count} />}
            icon="trash"
            onClick={onSelect}
            className={clsx(!dense && 'py-2')}
            parentClassName={clsx('pass-vault-submenu-vault-item w-full', selected && 'selected')}
            style={{
                '--vault-icon-color': VAULT_COLOR_MAP[VaultColor.COLOR_UNSPECIFIED],
            }}
            quickActions={[
                <DropdownMenuButton
                    key="trash-restore"
                    onClick={handleTrashRestore}
                    label={c('Label').t`Restore all items`}
                    icon="arrow-up-and-left"
                />,

                <DropdownMenuButton
                    key="trash-empty"
                    onClick={handleTrashEmpty}
                    label={c('Label').t`Empty trash`}
                    icon="trash-cross"
                    danger
                />,
            ]}
        />
    );
};
