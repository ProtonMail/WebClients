import { ContextSeparator } from '@proton/components';
import { ItemContextMenuProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import DriveItemContextMenu from '../Drive/DriveItemContextMenu';
import { GoToParent } from './ContextMenuButtons';

export default function SearchItemContextMenu(props: ItemContextMenuProps) {
    const { item, selectedItems, shareId, close } = props;

    const isOnlyOneItem = selectedItems.length === 1;

    return (
        <DriveItemContextMenu {...props}>
            {isOnlyOneItem && (
                <>
                    <ContextSeparator />
                    <GoToParent shareId={shareId} parentLinkId={item.ParentLinkID} close={close} />
                </>
            )}
        </DriveItemContextMenu>
    );
}
