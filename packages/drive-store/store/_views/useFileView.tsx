import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { SHARE_MEMBER_PERMISSIONS, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isProtonDocument, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { isIgnoredError } from '../../utils/errorHandling';
import { streamToBuffer } from '../../utils/stream';
import { useDocumentActions } from '../_documents';
import { useDownload, useDownloadProvider } from '../_downloads';
import usePublicDownload from '../_downloads/usePublicDownload';
import type { DecryptedLink } from '../_links';
import { useLink } from '../_links';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useFileViewNavigation, usePublicFileViewNavigation } from './useFileNavigation';
import { DEFAULT_SORT } from './usePublicFolderView';
import type { SortParams } from './utils/useSorting';

/**
 * useFileView provides data for file preview.
 */
export default function useFileView(shareId: string, linkId: string, useNavigation = false, revisionId?: string) {
    const { downloadStream, getPreviewThumbnail } = useDownload();
    const { downloadDocument } = useDocumentActions();
    const { getSharePermissions } = useDirectSharingInfo();
    // permissions load will be during the withLoading process, but we prefer to set owner by default,
    // so even if it's wrong permissions, BE will prevent any unauthorized actions
    const [permissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(SHARE_MEMBER_PERMISSIONS.OWNER);
    const [isPermissionsLoading, withPermissionsLoading] = useLoading(true);
    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile } = useFileViewBase(
        shareId,
        linkId,
        downloadStream,
        revisionId,
        getPreviewThumbnail
    );
    const navigation = useFileViewNavigation(useNavigation, shareId, link?.parentLinkId, linkId);

    const loadPermissions = async (abortSignal: AbortSignal) => {
        return getSharePermissions(abortSignal, shareId).then(setPermissions);
    };

    useEffect(() => {
        const ac = new AbortController();
        void withPermissionsLoading(loadPermissions(ac.signal));
        return () => {
            ac.abort();
        };
    }, []);

    return {
        permissions,
        navigation,
        isLinkLoading: isLinkLoading || isPermissionsLoading,
        isContentLoading,
        error,
        link,
        contents,
        contentsMimeType,
        downloadFile: async () => {
            if (isProtonDocument(contentsMimeType || link?.mimeType || '')) {
                await downloadDocument({
                    shareId,
                    linkId,
                });
                return;
            }

            await downloadFile();
        },
    };
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

    useEffect(() => {
        if (error) {
            metrics.drive_file_preview_errors_total.increment({
                type: !link ? 'unknown' : link.isFile ? 'file' : 'folder',
            });
        }
    }, [error]);

    return {
        permissions: SHARE_MEMBER_PERMISSIONS.READ,
        navigation,
        isLinkLoading,
        isContentLoading,
        error,
        link,
        contents,
        contentsMimeType,
        downloadFile,
    };
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
    const [isFallbackContents, setIsFallbackContents] = useState<boolean>(false);

    const preloadFile = async (abortSignal: AbortSignal) => {
        const link = await getLink(abortSignal, shareId, linkId);

        if (!link) {
            setContents(undefined);
            return;
        }

        setLink(link);
        setContentsMimeType(link.mimeType);

        if (isPreviewAvailable(link.mimeType, link.size)) {
            const { stream, controls } = downloadStream({
                ...link,
                shareId,
                revisionId,
            });
            const onAbort = () => {
                controls.cancel();
            };
            abortSignal.addEventListener('abort', onAbort);
            const buffer = await streamToBuffer(stream);
            setContents(buffer);
            // The download is done, we do not need to cancel download on abort anymore
            abortSignal.removeEventListener('abort', onAbort);
            // Fallback is only available for photos in private context
        } else if (!!link.activeRevision?.photo && getPreviewThumbnail && !isVideo(link.mimeType)) {
            // We force jpg type as thumbnails are always jpg for photos
            setContentsMimeType(SupportedMimeTypes.jpg);
            setIsFallbackContents(true);
            try {
                const previewThumbnail = await getPreviewThumbnail(abortSignal, shareId, linkId);
                setContents(previewThumbnail);
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
                buffer: isFallbackContents ? undefined : contents,
            },
        ]);
    }, [shareId, link, contents, isFallbackContents]);

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
