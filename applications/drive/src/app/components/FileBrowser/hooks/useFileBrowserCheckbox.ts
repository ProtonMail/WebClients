import { useCallback } from 'react';

import { useSelection } from '../state/useSelection';

export const useFileBrowserCheckbox = (id: string) => {
    const selectionControls = useSelection();
    const isSelected = Boolean(selectionControls?.isSelected(id));

    const handleCheckboxChange = useCallback((e) => {
        const el = document.activeElement ?? e.currentTarget;
        if (isSelected && 'blur' in el) {
            (el as any).blur();
        }
    }, []);

    const handleCheckboxClick = useCallback(
        (e) => {
            if (!e.shiftKey) {
                selectionControls?.toggleSelectItem(id);
            }
        },
        [selectionControls?.toggleSelectItem]
    );

    const handleCheckboxWrapperClick = useCallback(
        (e) => {
            e.stopPropagation();
            // Wrapper handles shift key, because FF has issues: https://bugzilla.mozilla.org/show_bug.cgi?id=559506
            if (e.shiftKey) {
                selectionControls?.toggleRange?.(id);
            }
        },
        [selectionControls?.toggleRange]
    );

    return {
        handleCheckboxChange,
        handleCheckboxClick,
        handleCheckboxWrapperClick,
    };
};
