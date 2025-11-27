import { type FC, type RefObject, useMemo } from 'react';

import { c } from 'ttag';

import type { BulkSelection } from '@proton/pass/components/Bulk/types';
import { bulkSelectionDTO } from '@proton/pass/components/Bulk/utils';
import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import type { ContextMenuElement, ContextMenuItem } from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { BulkSelectionDTO, ItemRevision } from '@proton/pass/types';

/** Returns context menu items about actions on the bulk selection */
const getBulkActionButtons = (
    isTrashed: boolean,
    { restoreMany, deleteMany, moveMany, trashMany }: ReturnType<typeof useItemsActions>,
    selection: BulkSelectionDTO
): ContextMenuItem[] => {
    return isTrashed
        ? [
              {
                  type: 'button',
                  icon: 'clock-rotate-left',
                  name: c('Action').t`Restore`,
                  action: () => restoreMany(selection),
              },
              {
                  type: 'button',
                  icon: 'trash-cross',
                  name: c('Action').t`Delete`,
                  action: () => deleteMany(selection),
              },
          ]
        : [
              {
                  type: 'button',
                  icon: 'folder-arrow-in',
                  name: c('Action').t`Move`,
                  action: () => moveMany(selection),
              },
              {
                  type: 'button',
                  icon: 'trash',
                  name: c('Action').t`Trash`,
                  action: () => trashMany(selection),
              },
          ];
};

type Props = { item: ItemRevision; bulk: BulkSelection; anchorRef: RefObject<HTMLElement> };

export const BulkItemsContextMenu: FC<Props> = ({ item, bulk, anchorRef }) => {
    const id = getItemKey(item);

    const trashed = isTrashed(item);
    const itemActions = useItemsActions();

    const elements: ContextMenuElement[] = useMemo(
        () => getBulkActionButtons(trashed, itemActions, bulkSelectionDTO(bulk)),
        [trashed, itemActions, bulk]
    );

    return (
        <ContextMenu
            key={id} // Force recreate on item change to recompute size
            id={id}
            anchorRef={anchorRef}
            elements={elements}
        />
    );
};
