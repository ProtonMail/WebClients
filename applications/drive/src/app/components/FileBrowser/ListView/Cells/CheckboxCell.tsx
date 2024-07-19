import { memo } from 'react';

import { Checkbox, TableCell } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { stopPropagation } from '../../../../utils/stopPropagation';
import { useFileBrowserCheckbox } from '../../hooks/useFileBrowserCheckbox';
import { SelectionState } from '../../hooks/useSelectionControls';
import type { FileBrowserBaseItem } from '../../interface';
import { useSelection } from '../../state/useSelection';

interface Props {
    className?: string;

    isDisabled?: boolean;
    isSelected?: boolean;

    onCheckboxChange?: (e: any) => void;
    onCheckboxClick?: (e: any) => void;
    onCheckboxWrapperClick?: (e: any) => void;
}

const CheckboxCellBase = ({
    className,

    isDisabled,
    isSelected,

    onCheckboxChange,
    onCheckboxClick,
    onCheckboxWrapperClick,
}: Props) => {
    return (
        <TableCell className="m-0 flex file-browser-list-checkbox-cell" data-testid="column-checkbox">
            <div
                role="presentation"
                className={clsx(['flex items-center pl-2', className])}
                onTouchStart={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={onCheckboxWrapperClick}
            >
                <Checkbox
                    disabled={isDisabled}
                    className="expand-click-area"
                    checked={isSelected}
                    onChange={onCheckboxChange}
                    onClick={onCheckboxClick}
                />
            </div>
        </TableCell>
    );
};

export const CheckboxCell = memo(({ item }: { item: FileBrowserBaseItem }) => {
    const selectionControls = useSelection();
    const isSelected = Boolean(selectionControls?.isSelected(item.id));

    const { handleCheckboxChange, handleCheckboxClick, handleCheckboxWrapperClick } = useFileBrowserCheckbox(item.id);

    return (
        <CheckboxCellBase
            className={
                selectionControls?.selectionState !== SelectionState.NONE ? undefined : 'mouse:group-hover:opacity-100'
            }
            isDisabled={Boolean(item.isLocked)}
            isSelected={isSelected}
            onCheckboxChange={handleCheckboxChange}
            onCheckboxClick={handleCheckboxClick}
            onCheckboxWrapperClick={handleCheckboxWrapperClick}
        />
    );
});

CheckboxCell.displayName = 'CheckboxCell';
