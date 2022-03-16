import { useEffect, useState, useCallback } from 'react';

import { useLoading } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { streamToBuffer } from '../../utils/stream';
import { useUserSettings } from '../settings';
import { logError, isIgnoredError } from '../utils';
import { useDownload, useDownloadProvider } from '../downloads';
import { DecryptedLink, useLink, useLinksListing } from '../links';
import { useMemoArrayNoMatterTheOrder, useAbortSignal, useControlledSorting } from './utils';

/**
 * useFileView provides data for file preview.
 */
export default function useFileView(shareId: string, linkId: string, useNavigation = false) {
    const { getLink } = useLink();
    const { download } = useDownloadProvider();
    const { downloadStream } = useDownload();

    const [isLoading, withLoading] = useLoading(true);
    const [error, setError] = useState<any>();
    const [link, setLink] = useState<DecryptedLink>();
    const [contents, setContents] = useState<Uint8Array[]>();
    const navigation = useFileViewNavigation(useNavigation, shareId, link?.parentLinkId, linkId);

    const preloadFile = async (abortSignal: AbortSignal) => {
        const link = await getLink(abortSignal, shareId, linkId);
        setLink(link);

        if (isPreviewAvailable(link.mimeType, link.size)) {
            const { stream, controls } = downloadStream([
                {
                    ...link,
                    shareId,
                },
            ]);
            abortSignal.addEventListener('abort', () => {
                controls.cancel();
            });

            setContents(await streamToBuffer(stream));
        } else {
            setContents(undefined);
        }
    };

    useEffect(() => {
        const ac = new AbortController();
        withLoading(preloadFile(ac.signal)).catch((err) => {
            if (!isIgnoredError(err)) {
                setError(err);
            }
        });
        return () => {
            ac.abort();
            setError(undefined);
            setLink(undefined);
            setContents(undefined);
        };
    }, [shareId, linkId]);

    const saveFile = useCallback(async () => {
        if (!link) {
            return;
        }
        void download([
            {
                ...link,
                shareId,
                buffer: contents,
            },
        ]);
    }, [shareId, linkId, link, contents]);

    return {
        isLoading,
        error,
        link,
        contents,
        saveFile,
        navigation,
    };
}

function useFileViewNavigation(useNavigation: boolean, shareId: string, parentLinkId?: string, currentLinkId?: string) {
    const [isLoading, withLoading] = useLoading(true);

    const { getCachedChildren, loadChildren } = useLinksListing();

    const abortSignal = useAbortSignal([shareId, parentLinkId]);
    const { links: children, isDecrypting } = parentLinkId
        ? getCachedChildren(abortSignal, shareId, parentLinkId)
        : { links: [], isDecrypting: false };
    const cachedChildren = useMemoArrayNoMatterTheOrder(children);
    const { sort } = useUserSettings();
    const { sortedList } = useControlledSorting(useNavigation ? cachedChildren : [], sort, async () => {});
    const linksAvailableForPreview = sortedList.filter(({ mimeType, size }) => isPreviewAvailable(mimeType, size));

    useEffect(() => {
        if (!useNavigation || !parentLinkId) {
            return;
        }

        const ac = new AbortController();
        withLoading(loadChildren(ac.signal, shareId, parentLinkId)).catch(logError);
        return () => {
            ac.abort();
        };
    }, [useNavigation, parentLinkId]);

    const index = linksAvailableForPreview.findIndex(({ linkId }) => linkId === currentLinkId);

    if (!useNavigation || isLoading || isDecrypting || index === -1) {
        return;
    }

    return {
        current: index + 1,
        total: linksAvailableForPreview.length,
        nextLinkId: linksAvailableForPreview[index < linksAvailableForPreview.length ? index + 1 : 0]?.linkId,
        prevLinkId: linksAvailableForPreview[index > 0 ? index - 1 : linksAvailableForPreview.length - 1]?.linkId,
    };
}
