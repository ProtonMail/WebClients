import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { generateErrorHandler } from '../_utils';
import {
    useAbortSignal,
    useControlledSorting,
    useIsActiveLinkReadOnly,
    useLinkName,
    useMemoArrayNoMatterTheOrder,
} from './utils';

/**
 * useFolderView provides data for folder view (file browser of folder).
 */
export default function useFolderView(folder: { shareId: string; linkId: string }) {
    const { shareId, linkId } = folder;
    const [error, setError] = useState<any>();
    const folderName = useLinkName(shareId, linkId, setError);

    const abortSignal = useAbortSignal([shareId, linkId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const { links: children, isDecrypting } = linksListing.getCachedChildren(abortSignal, shareId, linkId);
    const cachedChildren = useMemoArrayNoMatterTheOrder(children);

    const { layout, sort, changeSort } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useControlledSorting(cachedChildren, sort, changeSort);

    const { isReadOnly: isActiveLinkReadOnly, isLoading: isActiveLinkTypeLoading } = useIsActiveLinkReadOnly();

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(linksListing.loadChildren(ac.signal, shareId, linkId).catch(generateErrorHandler(setError)));
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);

    return {
        layout,
        folderName,
        isActiveLinkReadOnly: isActiveLinkReadOnly === undefined ? true : isActiveLinkReadOnly,
        items: sortedList,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting || isActiveLinkTypeLoading,
        error,
    };
}
