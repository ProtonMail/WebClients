import { useState, useEffect, RefObject, ReactNode } from 'react';

import { generateUID } from '../../helpers';
import { Dropdown } from '../dropdown';
import { CORNERS_ONLY_PLACEMENTS, Position } from '../popper/utils';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    isOpen: boolean;
    children: ReactNode;
    position?: {
        top: number;
        left: number;
    };
    close: () => void;
    autoClose?: boolean;
    noMaxHeight?: boolean;
}

const ContextMenu = ({
    anchorRef,
    children,
    isOpen,
    position,
    close,
    autoClose = true,
    noMaxHeight = false,
}: Props) => {
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

    // ContextMenu don't use the arrow, no need to complexify the API with arrow positioning
    const originalPosition: Position | undefined = position ? { ...position, '--arrow-offset': 0 } : undefined;

    return (
        <Dropdown
            id={uid}
            isOpen={isOpen}
            originalPosition={originalPosition}
            availablePlacements={CORNERS_ONLY_PLACEMENTS}
            noCaret
            autoCloseOutsideAnchor={false}
            originalPlacement="bottom-left"
            offset={1}
            anchorRef={anchorRef}
            onClose={close}
            onContextMenu={(e) => e.stopPropagation()}
            noMaxHeight={noMaxHeight}
        >
            {children}
        </Dropdown>
    );
};

export default ContextMenu;
