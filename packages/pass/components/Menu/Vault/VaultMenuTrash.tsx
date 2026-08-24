import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useItemDrop } from '../../../hooks/useItemDrag';
import { intoBulkSelection } from '../../../lib/items/item.utils';
import { selectTrashedItems } from '../../../store/selectors';
import type { UniqueItem } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { useItemsActions } from '../../Item/ItemActionsProvider';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { useVaultActions } from '../../Vault/VaultActionsProvider';
import { VaultIcon } from '../../Vault/VaultIcon';
import { getVaultOptionInfo } from './utils';

type Props = {
    selected: boolean;
    onAction?: () => void;
};

export const VaultMenuTrash = memo(({ selected, onAction = noop }: Props) => {
    const count = useSelector(selectTrashedItems).length;

    const vaultActions = useVaultActions();
    const itemActions = useItemsActions();

    const onTrashRestore = pipe(vaultActions.trashRestore, onAction);
    const onTrashEmpty = pipe(vaultActions.trashEmpty, onAction);

    const onDrop = useCallback((items: UniqueItem[]) => itemActions.trashMany(intoBulkSelection(items)), []);
    const { dragOver, dragProps } = useItemDrop(onDrop);

    const labelOptions = getVaultOptionInfo('trash');

    return (
        <DropdownMenuButton
            label={
                <div>
                    <div className="text-ellipsis">{labelOptions.label}</div>
                    <div className="color-weak">
                        {c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                    </div>
                </div>
            }
            icon={
                <VaultIcon
                    icon={labelOptions.icon}
                    className="shrink-0 mr-1"
                    size={4}
                    background
                    color={labelOptions.color}
                />
            }
            onClick={pipe(() => !selected && vaultActions.select('trash'), onAction)}
            className={clsx((selected || dragOver) && 'is-selected', 'pl-2 pr-2')}
            parentClassName="pass-vault-submenu-vault-item pass-vault-submenu-vault-item--trash w-full"
            quickActions={[
                <DropdownMenuButton
                    key="trash-restore"
                    onClick={onTrashRestore}
                    label={c('Label').t`Restore all items`}
                    icon="arrow-up-and-left"
                    disabled={count === 0}
                />,

                <DropdownMenuButton
                    key="trash-empty"
                    onClick={onTrashEmpty}
                    label={c('Label').t`Empty trash`}
                    icon="trash-cross"
                    disabled={count === 0}
                    danger
                />,
            ]}
            {...dragProps}
        />
    );
});

VaultMenuTrash.displayName = 'VaultMenuTrashMemo';
