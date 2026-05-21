import { type MouseEvent, useCallback } from 'react';

import { Checkbox } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { SelectionState } from '../../../legacy/components/FileBrowser/hooks/useSelectionControls';
import type { SelectionMethods } from '../types';

export interface CheckboxCellProps {
    uid: string;
    selectionMethods: SelectionMethods;
    className?: string;
    showOnlyOnHover?: boolean;
    style?: React.CSSProperties;
}

export const CheckboxCell = ({
    uid,
    selectionMethods,
    className,
    showOnlyOnHover = true,
    style,
}: CheckboxCellProps) => {
    const isSelected = Boolean(selectionMethods.isSelected(uid));

    const handleCheckboxClick = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            if (!e.shiftKey) {
                selectionMethods.toggleSelectItem(uid);
            }
        },
        [selectionMethods, uid]
    );

    const handleCheckboxWrapperClick = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            // Wrapper handles shift key, because FF has issues: https://bugzilla.mozilla.org/show_bug.cgi?id=559506
            if (e.shiftKey) {
                selectionMethods.toggleRange(uid);
            }
        },
        [selectionMethods, uid]
    );

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            role="presentation"
            className={clsx([
                showOnlyOnHover && !isSelected && selectionMethods.selectionState === SelectionState.NONE
                    ? 'mouse:group-hover:opacity-100'
                    : undefined,
                className,
            ])}
            style={style}
            //TODO: Check if we need this
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={handleCheckboxWrapperClick}
        >
            {/*
              The checked state is fully controlled by the onClick handlers, so readOnly is required to
              silence React's controlled-input warning (a checked input needs either onChange or readOnly).
              TODO(a11y): Get rid of that non-a11y compliant interaction wrapper div.
            */}
            <Checkbox className="expand-click-area" checked={isSelected} readOnly onClick={handleCheckboxClick} />
        </div>
    );
};
