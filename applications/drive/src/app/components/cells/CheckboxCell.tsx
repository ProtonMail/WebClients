import { Checkbox, TableCell } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useSelection } from '../FileBrowser';
import { useFileBrowserCheckbox } from '../FileBrowser/hooks/useFileBrowserCheckbox';
import { SelectionState } from '../FileBrowser/hooks/useSelectionControls';

interface CheckboxCellProps {
    uid: string;
    isLocked?: boolean;
}

export const CheckboxCell = ({ uid, isLocked }: CheckboxCellProps) => {
    const selectionControls = useSelection();
    const isSelected = Boolean(selectionControls?.isSelected(uid));

    const { handleCheckboxChange, handleCheckboxClick, handleCheckboxWrapperClick } = useFileBrowserCheckbox(uid);

    return (
        <TableCell className="m-0 flex file-browser-list-checkbox-cell" data-testid="column-checkbox">
            <div
                role="presentation"
                className={clsx([
                    'flex items-center pl-2',
                    selectionControls?.selectionState !== SelectionState.NONE
                        ? undefined
                        : 'mouse:group-hover:opacity-100',
                ])}
                onTouchStart={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={handleCheckboxWrapperClick}
            >
                <Checkbox
                    disabled={Boolean(isLocked)}
                    className="expand-click-area"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={handleCheckboxClick}
                />
            </div>
        </TableCell>
    );
};
