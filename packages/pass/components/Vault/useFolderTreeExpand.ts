import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FoldersByShareId } from '../../store/reducers';
import type { MaybeNull } from '../../types';
import { getExpandedFolderKeys } from './folderView.utils';

export type FolderTreeExpand = {
    expandedKeys: ReadonlySet<string>;
    toggle: (key: string) => void;
};

/** Collapsed-by-default expansion state for the vault/folder pickers, seeded
 * with the path expanded to the currently selected folder. */
export const useFolderTreeExpand = (
    folders: FoldersByShareId,
    shareId: MaybeNull<string>,
    folderId: MaybeNull<string>
): FolderTreeExpand => {
    const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(() => new Set());

    const pathKeys = useMemo(() => getExpandedFolderKeys(folders, shareId, folderId), [folders, shareId, folderId]);

    /** Re-seed when the target path changes: pickers can be mounted before the
     * selection is known (e.g modal re-opened) */
    useEffect(() => setExpandedKeys(new Set(pathKeys)), [pathKeys.join()]);

    const toggle = useCallback((key: string) => {
        setExpandedKeys((keys) => {
            const next = new Set(keys);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    return { expandedKeys, toggle };
};
