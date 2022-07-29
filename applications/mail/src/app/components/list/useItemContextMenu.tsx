import { RefObject, useCallback, useState } from 'react';

import { FeatureCode, useFeature } from '@proton/components';

import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
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
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const { feature: mailContextMenuFeature } = useFeature<boolean>(FeatureCode.MailContextMenu);

    const closeContextMenu = useCallback(() => setIsOpen(false), [setIsOpen]);
    const openContextMenu = useCallback(() => setIsOpen(true), [setIsOpen]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, element: Element) => {
            e.stopPropagation();
            e.preventDefault();

            if (!checkedIDs.includes(element.ID)) {
                onCheck([element.ID], true, true);
            }

            setContextMenuPosition({ top: e.clientY, left: e.clientX });
            openContextMenu();
        },
        [checkedIDs]
    );

    const contextMenu = mailContextMenuFeature?.Value ? (
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
        />
    ) : null;

    return {
        contextMenu,
        onContextMenu: handleContextMenu,
    };
};
