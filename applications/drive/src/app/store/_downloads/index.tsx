import { useUser } from '@proton/components/hooks';
import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';

import { useUserIfAuthenticated } from '../../hooks/util/useUserIfAuthenticated';
import { usePublicSession } from '../_api';
import { DownloadProvider } from './DownloadProvider';
import { ThumbnailsDownloadProvider } from './ThumbnailDownloadProvider';
import useDownload from './useDownload';
import usePublicDownload from './usePublicDownload';

export { useDownloadProvider } from './DownloadProvider';
export { useThumbnailsDownload } from './ThumbnailDownloadProvider';
export { default as useDownload } from './useDownload';
export { useDownloadScanFlag } from './useDownloadScanFeatureFlag';

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
    const { initDownload, downloadThumbnail } = useDownload();
    const [user] = useUser();

    const downloadThumbnailsCb = async (
        signal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadUrl: string,
        downloadToken: string
    ) => {
        const { contents, abortController, verifiedPromise } = await downloadThumbnail(
            signal,
            shareId,
            linkId,
            downloadUrl,
            downloadToken
        );

        if (signal.aborted) {
            abortController.abort();
        } else {
            signal.addEventListener('abort', () => {
                abortController.abort();
            });
        }

        return { contents, verifiedPromise };
    };

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            <ThumbnailsDownloadProvider downloadThumbnail={downloadThumbnailsCb}>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}

export function PublicDownloadsProvider({ children }: { children: React.ReactNode }) {
    const { initDownload, downloadThumbnail } = usePublicDownload();
    const { getSessionInfo, isSessionProtonUser } = usePublicSession();
    const { user } = useUserIfAuthenticated(isSessionProtonUser(), getSessionInfo()?.sessionUid);

    const downloadThumbnailsCb = async (
        signal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadUrl: string,
        downloadToken: string
    ) => {
        const contents = downloadThumbnail(signal, shareId, linkId, {
            BareURL: downloadUrl,
            Token: downloadToken,
        });

        return { contents, verifiedPromise: Promise.resolve(VERIFICATION_STATUS.NOT_SIGNED) };
    };

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            <ThumbnailsDownloadProvider downloadThumbnail={downloadThumbnailsCb}>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}

export * from './interface';
