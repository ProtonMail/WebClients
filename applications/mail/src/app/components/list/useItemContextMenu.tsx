import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import useBlockSender from '../../hooks/useBlockSender';
import type { Element } from '../../models/element';
import ItemContextMenu from './ItemContextMenu';
import type { SOURCE_ACTION } from './list-telemetry/useListTelemetry';

interface Props {
    elementID?: string;
    labelID: string;
    anchorRef: RefObject<HTMLElement>;
    checkedIDs: string[];
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    onMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => void;
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    conversationMode: boolean;
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
    conversationMode,
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
            conversationMode={conversationMode}
        />
    );

    return {
        contextMenu,
        onContextMenu: handleContextMenu,
        blockSenderModal,
    };
};
