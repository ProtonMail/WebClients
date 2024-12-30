import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useItemDrop } from '@proton/pass/hooks/useItemDrag';
import { intoBulkSelection } from '@proton/pass/lib/items/item.utils';
import { selectTrashedItems } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    dense?: boolean;
    selected: boolean;
    onAction?: () => void;
};

export const VaultMenuTrash = memo(({ dense, selected, onAction = noop }: Props) => {
    const count = useSelector(selectTrashedItems).length;

    const vaultActions = useVaultActions();
    const itemActions = useItemsActions();

    const onTrashRestore = pipe(vaultActions.trashRestore, onAction);
    const onTrashEmpty = pipe(vaultActions.trashEmpty, onAction);
    const onSelect = pipe(() => vaultActions.select('trash'), onAction);

    const onDrop = useCallback((items: UniqueItem[]) => itemActions.trashMany(intoBulkSelection(items)), []);
    const { dragOver, dragProps } = useItemDrop(onDrop);

    return (
        <DropdownMenuButton
            label={c('Label').t`Trash`}
            icon="trash"
            onClick={onSelect}
            className={clsx((selected || dragOver) && 'is-selected', !dense && 'py-3')}
            parentClassName="pass-vault-submenu-vault-item w-full"
            style={{ '--max-h-custom': '1.25rem' }}
            quickActions={[
                <DropdownMenuButton
                    key="trash-restore"
                    onClick={onTrashRestore}
                    label={c('Label').t`Restore all items`}
                    icon="arrow-up-and-left"
                />,

                <DropdownMenuButton
                    key="trash-empty"
                    onClick={onTrashEmpty}
                    label={c('Label').t`Empty trash`}
                    icon="trash-cross"
                    danger
                />,
            ]}
            extra={<span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>}
            {...dragProps}
        />
    );
});

VaultMenuTrash.displayName = 'VaultMenuTrashMemo';
