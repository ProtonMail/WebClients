import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setFolderExpanded } from '../store/actions/creators/folder-expanded';
import { selectIsFolderExpanded } from '../store/selectors/folder-expanded';

/** Expanded state of a vault or folder in the menu, kept across restarts */
export const useFolderExpanded = (id: string) => {
    const dispatch = useDispatch();
    const expanded = useSelector(selectIsFolderExpanded(id));
    const setValue = useCallback(
        (next: boolean) => {
            if (next !== expanded) dispatch(setFolderExpanded({ id, expanded: next }));
        },
        [id, expanded]
    );

    return [expanded, setValue] as const;
};
