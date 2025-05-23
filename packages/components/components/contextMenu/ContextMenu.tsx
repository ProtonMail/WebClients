import type { ReactNode, RefObject } from 'react';
import { useEffect, useState } from 'react';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import type { PopperPosition } from '@proton/components/components/popper/interface';
import { cornerPopperPlacements } from '@proton/components/components/popper/utils';
import generateUID from '@proton/utils/generateUID';

export interface ContextMenuProps {
    anchorRef: RefObject<HTMLElement>;
    isOpen: boolean;
    children: ReactNode;
    position?: PopperPosition;
    close: () => void;
    autoClose?: boolean;
    size?: DropdownProps['size'];
}

const ContextMenu = ({ anchorRef, children, isOpen, position, close, autoClose = true, size }: ContextMenuProps) => {
    const [uid] = useState(generateUID('context-menu'));

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleContextMenu = () => {
            if (autoClose) {
                close();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu, { capture: true });

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
        };
    }, [isOpen, autoClose, close]);

    return (
        <Dropdown
            id={uid}
            isOpen={isOpen}
            anchorRef={anchorRef}
            anchorPosition={position || null}
            availablePlacements={cornerPopperPlacements}
            noCaret
            autoCloseOutsideAnchor={false}
            originalPlacement="bottom-start"
            offset={1}
            onClose={close}
            onContextMenu={(e) => e.stopPropagation()}
            size={size}
        >
            {children}
        </Dropdown>
    );
};

export default ContextMenu;
