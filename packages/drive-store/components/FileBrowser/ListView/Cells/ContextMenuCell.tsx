import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, TableCell } from '@proton/components';

import type { FileBrowserBaseItem } from '../../interface';
import { useItemContextMenu } from '../../state/useItemContextMenu';
import { useSelection } from '../../state/useSelection';

export const ContextMenuCell = ({ item }: { item: FileBrowserBaseItem }) => {
    const contextMenuControls = useItemContextMenu();
    const selectionControls = useSelection();

    const isContextMenuButtonActive =
        contextMenuControls.isOpen && selectionControls?.selectedItemIds.includes(item.id);
    return (
        <TableCell
            className="m-0 file-browser-list--icon-column file-browser-list--context-menu-column flex items-center"
            data-testid="column-options"
        >
            <Button
                shape="ghost"
                size="small"
                icon
                onClick={(e) => {
                    selectionControls?.selectItem(item.id);
                    contextMenuControls.handleContextMenu(e);
                }}
                onTouchEnd={(e) => {
                    selectionControls?.selectItem(item.id);
                    contextMenuControls.handleContextMenuTouch?.(e);
                }}
                className={isContextMenuButtonActive ? 'file-browser--options-focus' : 'mouse:group-hover:opacity-100'}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
            </Button>
        </TableCell>
    );
};
