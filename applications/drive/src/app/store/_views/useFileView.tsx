import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { isIgnoredError } from '../../utils/errorHandling';
import { streamToBuffer } from '../../utils/stream';
import { useDownload, useDownloadProvider } from '../_downloads';
import usePublicDownload from '../_downloads/usePublicDownload';
import { DecryptedLink, useLink } from '../_links';
import { useFileViewNavigation, usePublicFileViewNavigation } from './useFileNavigation';
import { DEFAULT_SORT } from './usePublicFolderView';
import { SortParams } from './utils/useSorting';

/**
 * useFileView provides data for file preview.
 */
export default function useFileView(shareId: string, linkId: string, useNavigation = false, revisionId?: string) {
    const { downloadStream, getPreviewThumbnail } = useDownload();
    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile } = useFileViewBase(
        shareId,
        linkId,
        downloadStream,
        revisionId,
        getPreviewThumbnail
    );
    const navigation = useFileViewNavigation(useNavigation, shareId, link?.parentLinkId, linkId);

    return { navigation, isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile };
}

export function usePublicFileView(
    shareId: string,
    linkId: string,
    useNavigation = false,
    sortParams: SortParams = DEFAULT_SORT
) {
    const { downloadStream } = usePublicDownload();
    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile } = useFileViewBase(
        shareId,
        linkId,
        downloadStream
    );
    const navigation = usePublicFileViewNavigation(useNavigation, shareId, sortParams, link?.parentLinkId, linkId);

    return { navigation, isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile };
}

function useFileViewBase(
    shareId: string,
    linkId: string,
    downloadStream: ReturnType<typeof usePublicDownload>['downloadStream'],
    revisionId?: string,
    getPreviewThumbnail?: ReturnType<typeof useDownload>['getPreviewThumbnail']
) {
    const { getLink } = useLink();
    const { download } = useDownloadProvider();
    const [isContentLoading, withContentLoading] = useLoading(true);

    const [error, setError] = useState<any>();
    const [link, setLink] = useState<DecryptedLink>();
    const [contents, setContents] = useState<Uint8Array[]>();
    const [contentsMimeType, setContentsMimeType] = useState<string>();

    const preloadFile = async (abortSignal: AbortSignal) => {
        const link = await getLink(abortSignal, shareId, linkId);

        if (!link) {
            setContents(undefined);
            return;
        }

        setLink(link);
        if (isPreviewAvailable(link.mimeType, link.size)) {
            setContentsMimeType(link.mimeType);
            const { stream, controls } = downloadStream([
                {
                    ...link,
                    shareId,
                    revisionId,
                },
            ]);
            abortSignal.addEventListener('abort', () => {
                controls.cancel();
            });

            setContents(await streamToBuffer(stream));
            // Fallback is only available for photos in private context
        } else if (!!link.activeRevision?.photo && getPreviewThumbnail) {
            // We force jpg type as thumbnails are always jpg for photos
            setContentsMimeType(SupportedMimeTypes.jpg);
            try {
                const hdThumbnail = await getPreviewThumbnail(abortSignal, shareId, linkId);
                setContents(await hdThumbnail.contents);
            } catch {
                setContents(undefined);
            }
        } else {
            setContents(undefined);
            return;
        }
        // After file content download is finished we have complete information
        // about signatures
        setLink(await getLink(abortSignal, shareId, linkId));
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
        contentsMimeType,
        downloadFile,
    };
}
