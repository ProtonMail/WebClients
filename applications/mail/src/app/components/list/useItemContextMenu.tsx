import { RefObject, useCallback, useState } from 'react';

import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import useBlockSender from '../../hooks/useBlockSender';
import { Element } from '../../models/element';
import ItemContextMenu from './ItemContextMenu';

interface Props {
    elementID?: string;
    labelID: string;
    anchorRef: RefObject<HTMLElement>;
    checkedIDs: string[];
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    onMarkAs: (status: MARK_AS_STATUS) => void;
    onMove: (labelID: string) => void;
    onDelete: () => void;
}

export const useItemContextMenu = ({
    elementID,
    labelID,
    anchorRef,
    checkedIDs,
    onCheck,
    onMarkAs,
    onMove,
    onDelete,
}: Props) => {
    const [selectedElement, setSelectedElement] = useState<Element>();
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

    const closeContextMenu = useCallback(() => setIsOpen(false), [setIsOpen]);
    const openContextMenu = useCallback(() => setIsOpen(true), [setIsOpen]);

    const getElementsFromIDs = useGetElementsFromIDs();
    const { canShowBlockSender, handleClickBlockSender, blockSenderModal } = useBlockSender({
        elements: [...(getElementsFromIDs([selectedElement?.ID || '']) || ({} as Element))],
        onCloseDropdown: closeContextMenu,
    });

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, element: Element) => {
            e.stopPropagation();
            e.preventDefault();

            if (!checkedIDs.includes(element.ID)) {
                onCheck([element.ID], true, true);
            }

            setContextMenuPosition({ top: e.clientY, left: e.clientX });
            setSelectedElement(element);
            openContextMenu();
        },
        [checkedIDs]
    );

    const contextMenu = (
        <ItemContextMenu
            anchorRef={anchorRef}
            isOpen={isContextMenuOpen}
            open={openContextMenu}
            close={closeContextMenu}
            position={contextMenuPosition}
            elementID={elementID}
            labelID={labelID}
            checkedIDs={checkedIDs}
            onMarkAs={onMarkAs}
            onMove={onMove}
            onDelete={onDelete}
            canShowBlockSender={canShowBlockSender}
            onBlockSender={handleClickBlockSender}
        />
    );

    return {
        contextMenu,
        onContextMenu: handleContextMenu,
        blockSenderModal,
    };
};
