import { useUser } from '@proton/account/user/hooks';

import { usePublicSession } from '../_api';
import { useLinksListing, usePublicLinksListing } from '../_links';
import { DownloadProvider } from './DownloadProvider';
import { ThumbnailsDownloadProvider } from './ThumbnailDownloadProvider';
import useDownload from './useDownload';

export { useDownloadProvider } from './DownloadProvider';
export { useThumbnailsDownload } from './ThumbnailDownloadProvider';
export { default as useDownload } from './useDownload';
export { useDownloadScanFlag } from './useDownloadScanFeatureFlag';

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
    const { getCachedChildren, loadChildren } = useLinksListing();
    const { initDownload, downloadThumbnail } = useDownload({ loadChildren, getCachedChildren });
    const [user] = useUser();

    const downloadThumbnailsCb = async (
        signal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadUrl: string,
        downloadToken: string,
        activeRevisionId?: string
    ) => {
        const { contents, abortController, verificationStatusPromise } = await downloadThumbnail(
            signal,
            shareId,
            linkId,
            downloadUrl,
            downloadToken,
            activeRevisionId
        );

        if (signal.aborted) {
            abortController.abort();
        } else {
            signal.addEventListener('abort', () => {
                abortController.abort();
            });
        }

        return { contents, verificationStatusPromise };
    };

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            <ThumbnailsDownloadProvider downloadThumbnail={downloadThumbnailsCb}>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}

export function PublicDownloadsProvider({ children }: { children: React.ReactNode }) {
    const { user, request } = usePublicSession();

    const { getCachedChildren, loadChildren } = usePublicLinksListing();
    const { initDownload, downloadThumbnail } = useDownload({
        customDebouncedRequest: request,
        getCachedChildren,
        loadChildren,
    });

    const downloadThumbnailsCb = async (
        signal: AbortSignal,
        token: string,
        linkId: string,
        downloadUrl: string,
        downloadToken: string,
        activeRevisionId?: string
    ) => {
        const { contents, verificationStatusPromise } = await downloadThumbnail(
            signal,
            token,
            linkId,
            downloadUrl,
            downloadToken,
            activeRevisionId
        );

        return { contents, verificationStatusPromise };
    };

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            <ThumbnailsDownloadProvider downloadThumbnail={downloadThumbnailsCb}>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}

export * from './interface';
