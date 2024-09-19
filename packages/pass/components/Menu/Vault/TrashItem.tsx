import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { VAULT_COLOR_MAP } from '@proton/pass/components/Vault/constants';
import { selectTrashedItems } from '@proton/pass/store/selectors';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';

type Props = {
    dense?: boolean;
    selected: boolean;
    handleTrashEmpty: () => void;
    handleTrashRestore: () => void;
    onSelect: () => void;
};

export const TrashItem: FC<Props> = ({ dense, selected, handleTrashRestore, handleTrashEmpty, onSelect }) => {
    const count = useSelector(selectTrashedItems).length;

    return (
        <DropdownMenuButton
            label={c('Label').t`Trash`}
            icon="trash"
            onClick={onSelect}
            className={clsx(!dense && 'py-3')}
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
            extra={<span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>}
        />
    );
};
