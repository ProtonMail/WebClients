import { useEffect, useMemo } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useSelectionControls } from '../../components/FileBrowser';
import { sendErrorReport } from '../../utils/errorHandling';
import { usePublicLinksListing } from '../_links';
import { useAbortSignal, useLinkName, useMemoArrayNoMatterTheOrder, useSortingWithDefault } from './utils';
import { SortField } from './utils/useSorting';

export const DEFAULT_SORT = {
    sortField: SortField.name,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * usePublicFolderView provides data for folder view (file browser of folder).
 * It is very similar to useFolderView for private app, this is just for the
 * publicly shared folder.
 */
export default function usePublicFolderView(token: string, linkId: string) {
    const folderName = useLinkName(token, linkId);

    const abortSignal = useAbortSignal([token, linkId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = usePublicLinksListing();
    const { links: children, isDecrypting } = linksListing.getCachedChildren(abortSignal, token, linkId);
    const cachedChildren = useMemoArrayNoMatterTheOrder(children);

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedChildren, DEFAULT_SORT);

    const sortedListForSelection = useMemo(() => {
        return sortedList.map((item) => ({
            id: item.linkId,
            disabled: item.isLocked,
            data: item,
        }));
    }, [sortedList]);

    const selectionControls = useSelectionControls({ itemIds: sortedListForSelection.map((item) => item.id) });

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(linksListing.loadChildren(ac.signal, token, linkId).catch(sendErrorReport));
        return () => {
            ac.abort();
        };
    }, [token, linkId]);

    return {
        layout: LayoutSetting.List,
        folderName,
        items: sortedList,
        sortParams,
        setSorting,
        selectionControls,
        isLoading: isLoading || isDecrypting,
    };
}
