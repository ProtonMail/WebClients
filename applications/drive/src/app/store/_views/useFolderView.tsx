import { useEffect } from 'react';

import { useLoading } from '@proton/components';

import { useUserSettings } from '../_settings';
import { useLinksListing } from '../_links';
import { useMemoArrayNoMatterTheOrder, useAbortSignal, useLinkName, useControlledSorting } from './utils';

/**
 * useFolderView provides data for folder view (file browser of folder).
 */
export default function useFolderView(folder: { shareId: string; linkId: string }) {
    const { shareId, linkId } = folder;
    const folderName = useLinkName(shareId, linkId);

    const abortSignal = useAbortSignal([shareId, linkId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const { links: children, isDecrypting } = linksListing.getCachedChildren(abortSignal, shareId, linkId);
    const cachedChildren = useMemoArrayNoMatterTheOrder(children);

    const { layout, sort, changeSort } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useControlledSorting(cachedChildren, sort, changeSort);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(linksListing.loadChildren(ac.signal, shareId, linkId));
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);

    return {
        layout,
        folderName,
        items: sortedList,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting,
    };
}
