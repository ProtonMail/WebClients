import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import {
    getFileExtension,
    isIWAD,
    isProtonDocsDocument,
    isProtonDocsSpreadsheet,
    isRAWThumbnailExtractionSupported,
    isVideo,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import type { VideoData } from '@proton/shared/lib/interfaces/drive/video';

import { useVideoStreaming } from '../../hooks/util/useVideoStreaming';
import { isIgnoredError } from '../../utils/errorHandling';
import { streamToBuffer } from '../../utils/stream';
import { unleashVanillaStore } from '../../zustand/unleash/unleash.store';
import { usePublicSession } from '../_api';
import { useDocumentActions } from '../_documents';
import { useDownload, useDownloadProvider } from '../_downloads';
import type { UseDownloadProps } from '../_downloads/useDownload';
import type { DecryptedLink } from '../_links';
import { useLink, useLinksListing, usePublicLinksListing } from '../_links';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useFileViewNavigation, usePublicFileViewNavigation } from './useFileNavigation';
import { DEFAULT_SORT } from './usePublicFolderView';
import type { SortParams } from './utils/useSorting';

/**
 * useFileView provides data for file preview.
 */
export default function useFileView(shareId: string, linkId: string, useNavigation = false, revisionId?: string) {
    const { getCachedChildren, loadChildren } = useLinksListing();
    const { downloadDocument } = useDocumentActions();
    const { getSharePermissions } = useDirectSharingInfo();
    // permissions load will be during the withLoading process, but we prefer to set owner by default,
    // so even if it's wrong permissions, BE will prevent any unauthorized actions
    const [permissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(SHARE_MEMBER_PERMISSIONS.OWNER);
    const [isPermissionsLoading, withPermissionsLoading] = useLoading(true);
    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile, videoStreaming } =
        useFileViewBase(shareId, linkId, { getCachedChildren, loadChildren }, revisionId);
    const navigation = useFileViewNavigation(useNavigation, shareId, link?.parentLinkId, linkId);

    const loadPermissions = useCallback(async (abortSignal: AbortSignal, shareId: string) => {
        return getSharePermissions(abortSignal, shareId).then(setPermissions);
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        void withPermissionsLoading(loadPermissions(ac.signal, shareId));
        return () => {
            ac.abort();
        };
    }, [shareId, linkId, revisionId, loadPermissions]);

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
            const mimeType = contentsMimeType || link?.mimeType || '';

            if (isProtonDocsDocument(mimeType)) {
                await downloadDocument({
                    type: 'doc',
                    shareId,
                    linkId,
                });
                return;
            } else if (isProtonDocsSpreadsheet(mimeType)) {
                await downloadDocument({
                    type: 'sheet',
                    shareId,
                    linkId,
                });
                return;
            }

            await downloadFile();
        },
        videoStreaming,
    };
}

export function usePublicFileView(
    shareId: string,
    linkId: string,
    useNavigation = false,
    sortParams: SortParams = DEFAULT_SORT
) {
    const { getCachedChildren, loadChildren } = usePublicLinksListing();
    const { request } = usePublicSession();
    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile, videoStreaming } =
        useFileViewBase(shareId, linkId, { getCachedChildren, loadChildren, customDebouncedRequest: request });
    const navigation = usePublicFileViewNavigation(useNavigation, shareId, sortParams, link?.parentLinkId, linkId);

    useEffect(() => {
        if (error) {
            metrics.drive_file_preview_errors_total.increment({
                type: !link ? 'unknown' : link.isFile ? 'file' : 'folder',
            });
        }
    }, [error]);

    return {
        permissions: SHARE_MEMBER_PERMISSIONS.VIEWER,
        navigation,
        isLinkLoading,
        isContentLoading,
        error,
        link,
        contents,
        contentsMimeType,
        downloadFile,
        videoStreaming,
    };
}

function useFileViewBase(
    shareId: string,
    linkId: string,
    { getCachedChildren, loadChildren, customDebouncedRequest }: UseDownloadProps,
    revisionId?: string
) {
    const { downloadStream, getPreviewThumbnail, getVideoData, downloadSlices } = useDownload({
        getCachedChildren,
        loadChildren,
        customDebouncedRequest,
    });
    const { getLink } = useLink();
    const { download } = useDownloadProvider();
    const [isContentLoading, withContentLoading] = useLoading(true);
    const isVideoStreamingEnabled = unleashVanillaStore.getState().isEnabled('DriveWebVideoStreaming');

    const [error, setError] = useState<any>();
    const [link, setLink] = useState<DecryptedLink>();
    const [contents, setContents] = useState<Uint8Array<ArrayBuffer>[]>();

    const [videoData, setVideoData] = useState<VideoData>();

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

        // These attributes are only used for Video Streaming
        if (isVideo(link.mimeType) && isVideoStreamingEnabled) {
            const { xAttr } = await getVideoData(abortSignal, shareId, linkId, {
                PageSize: 1,
                FromBlockIndex: 1,
            });
            if (xAttr && xAttr.Common.BlockSizes) {
                setVideoData({
                    blockSizes: xAttr.Common.BlockSizes,
                });
            }
        }

        if (isPreviewAvailable(link.mimeType, link.size) || isIWAD(link.mimeType)) {
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
        } else if (!!link.activeRevision?.photo && !isVideo(link.mimeType)) {
            // it actually does not matter what we set for the preview
            // thumbnail will be either jpg or webp
            // most recent will be webp
            setContentsMimeType(SupportedMimeTypes.webp);
            setIsFallbackContents(true);
            try {
                const previewThumbnail = await getPreviewThumbnail(abortSignal, shareId, linkId);
                setContents(previewThumbnail);
            } catch {
                setContents(undefined);
            }
        } else if (isRAWThumbnailExtractionSupported(link.mimeType, getFileExtension(link.name))) {
            // it actually does not matter what we set for the preview
            // thumbnail will be either jpg or webp
            // most recent will be webp
            setContentsMimeType(SupportedMimeTypes.webp);
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

    const downloadSlice = useCallback(
        async (abortSignal: AbortSignal, indices: number[]) => {
            if (!link) {
                return;
            }
            const { blocks, manifestSignature } = await getVideoData(abortSignal, shareId, linkId, {
                PageSize: (indices.at(-1) || 0) - (indices.at(0) || 0) + 1,
                FromBlockIndex: (indices.at(0) || 0) + 1, // BE index starts from 1 and not 0
            });
            const { stream, controls } = downloadSlices(
                {
                    ...link,
                    shareId,
                    revisionId,
                },
                blocks,
                manifestSignature
            );
            const onAbort = () => {
                controls.cancel();
            };
            abortSignal.addEventListener('abort', onAbort);
            const buffer = await streamToBuffer(stream);
            abortSignal.removeEventListener('abort', onAbort);
            return buffer;
        },
        [shareId, link, revisionId, downloadSlices]
    );

    const videoStreaming = useVideoStreaming({
        mimeType: link?.mimeType,
        videoData,
        downloadSlice,
    });

    return {
        isLinkLoading: !link && !error,
        isContentLoading,
        error,
        link,
        contents,
        contentsMimeType,
        downloadFile,
        videoStreaming,
    };
}
