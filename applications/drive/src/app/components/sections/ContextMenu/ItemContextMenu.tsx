import { useEffect } from 'react';

import { ContextMenu, DropdownSizeUnit } from '@proton/components';

import type { ContextMenuProps } from '../../FileBrowser/interface';

export function ItemContextMenu({ anchorRef, isOpen, position, open, close, children }: ContextMenuProps) {
    useEffect(() => {
        if (position) {
            /*
                close event doesn't fire on mobile when clicking on another context menu target.
                unless menu is manually closed, it retains its position
            */
            if (isOpen) {
                close();
            }
            open();
        }
    }, [position?.left, position?.top]);

    return (
        <ContextMenu
            isOpen={isOpen}
            close={close}
            position={position}
            size={{ maxHeight: DropdownSizeUnit.Viewport, maxWidth: DropdownSizeUnit.Viewport }}
            anchorRef={anchorRef}
        >
            {children}
        </ContextMenu>
    );
}
