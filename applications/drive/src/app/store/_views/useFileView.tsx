import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { isIgnoredError, logError } from '../../utils/errorHandling';
import { streamToBuffer } from '../../utils/stream';
import { useDownload, useDownloadProvider } from '../_downloads';
import { DecryptedLink, useLink, useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useAbortSignal, useControlledSorting, useMemoArrayNoMatterTheOrder } from './utils';

/**
 * useFileView provides data for file preview.
 */
export default function useFileView(shareId: string, linkId: string, useNavigation = false) {
    const { getLink } = useLink();
    const { download } = useDownloadProvider();
    const { downloadStream } = useDownload();

    const [isContentLoading, withContentLoading] = useLoading(true);

    const [error, setError] = useState<any>();
    const [link, setLink] = useState<DecryptedLink>();
    const [contents, setContents] = useState<Uint8Array[]>();
    const navigation = useFileViewNavigation(useNavigation, shareId, link?.parentLinkId, linkId);

    const preloadFile = async (abortSignal: AbortSignal) => {
        const link = await getLink(abortSignal, shareId, linkId);

        if (link && isPreviewAvailable(link.mimeType, link.size)) {
            setLink(link);
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
            // After file content download is finished we have complete information
            // about signatures
            setLink(await getLink(abortSignal, shareId, linkId));
        } else {
            setContents(undefined);
            if (link) {
                setLink(link);
            }
        }
    };

    useEffect(() => {
        const ac = new AbortController();

        withContentLoading(preloadFile(ac.signal)).catch((err) => {
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

    const downloadFile = useCallback(async () => {
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
    }, [shareId, link, contents]);

    return {
        isLinkLoading: !link && !error,
        isContentLoading,
        error,
        link,
        contents,
        downloadFile,
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
