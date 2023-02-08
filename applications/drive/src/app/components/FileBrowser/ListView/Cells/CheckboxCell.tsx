import { memo } from 'react';

import { Checkbox, TableCell, classnames } from '@proton/components';

import { stopPropagation } from '../../../../utils/stopPropagation';
import { useFileBrowserCheckbox } from '../../hooks/useFileBrowserCheckbox';
import { SelectionState } from '../../hooks/useSelectionControls';
import { FileBrowserBaseItem } from '../../interface';
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
        <TableCell className="m0 flex file-browser-list-checkbox-cell" data-testid="column-checkbox">
            <div
                role="presentation"
                className={classnames(['flex flex-align-items-center', className])}
                onTouchStart={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={onCheckboxWrapperClick}
            >
                <Checkbox
                    disabled={isDisabled}
                    className="increase-click-surface"
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
                selectionControls?.selectionState !== SelectionState.NONE ? undefined : 'opacity-on-hover-only-desktop'
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
