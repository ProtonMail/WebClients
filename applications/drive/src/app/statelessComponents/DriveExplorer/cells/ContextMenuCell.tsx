import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import clsx from '@proton/utils/clsx';

import type { CellDefinition, ContextMenuControls, SelectionMethods } from '../types';

export interface ContextMenuCellProps {
    isActive?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    className?: string;
}

export const ContextMenuCell = ({ isActive = false, onClick, className }: ContextMenuCellProps) => {
    return (
        <Button
            shape="ghost"
            size="small"
            icon
            onClick={onClick}
            className={clsx(
                isActive && 'file-browser--options-focus',
                !isActive && 'mouse:group-hover:opacity-100',
                className
            )}
        >
            <IcThreeDotsVertical alt={c('Action').t`More options`} />
        </Button>
    );
};

export const ContextMenuCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'contextMenuButton',
    width: '3rem',
};

interface ContextMenuCellWithControlsProps {
    uid: string;
    isSelected: boolean;
    contextMenuControls: ContextMenuControls;
    selectionMethods: SelectionMethods;
}

export function ContextMenuCellWithControls({
    uid,
    isSelected,
    contextMenuControls,
    selectionMethods,
}: ContextMenuCellWithControlsProps) {
    const isActive = contextMenuControls.isOpen && isSelected;

    const handleClick = (e: React.MouseEvent) => {
        selectionMethods.selectItem(uid);
        contextMenuControls.showContextMenu(e);
    };

    return <ContextMenuCell isActive={isActive} onClick={handleClick} />;
}
