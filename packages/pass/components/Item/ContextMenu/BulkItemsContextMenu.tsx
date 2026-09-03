import { type FC, type RefObject, useMemo } from 'react';

import { c } from 'ttag';

import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';

import { isTrashed } from '../../../lib/items/item.predicates';
import { getItemKey } from '../../../lib/items/item.utils';
import type { BulkSelectionDTO, ItemRevision } from '../../../types';
import type { BulkSelection } from '../../Bulk/types';
import { bulkSelectionDTO } from '../../Bulk/utils';
import { ContextMenu } from '../../ContextMenu/ContextMenu';
import type { ContextMenuElement, ContextMenuItem } from '../../ContextMenu/ContextMenuItems';
import { useItemsActions } from '../ItemActionsProvider';

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
                  icon: <IcClockRotateLeft />,
                  name: c('Action').t`Restore`,
                  action: () => restoreMany(selection),
              },
              {
                  type: 'button',
                  icon: <IcTrashCross />,
                  name: c('Action').t`Delete`,
                  action: () => deleteMany(selection),
              },
          ]
        : [
              {
                  type: 'button',
                  icon: <IcFolderArrowIn />,
                  name: c('Action').t`Move`,
                  action: () => moveMany(selection),
              },
              {
                  type: 'button',
                  icon: <IcTrash />,
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
