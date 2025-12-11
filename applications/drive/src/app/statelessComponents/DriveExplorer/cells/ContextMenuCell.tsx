import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from '../types';

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
            <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
        </Button>
    );
};

export const ContextMenuCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'contextMenuButton',
    width: '3rem',
};
