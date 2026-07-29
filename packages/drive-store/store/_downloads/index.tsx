import { useUser } from '@proton/account/user/hooks';

import usePublicSession from '../_api/usePublicSession';
import useLinksListing from '../_links/useLinksListing/useLinksListing';
import usePublicLinksListing from '../_links/useLinksListing/usePublicLinksListing';
import { DownloadProvider } from './DownloadProvider';
import useDownload from './useDownload';

export { useDownloadProvider } from './DownloadProvider';
export { useThumbnailsDownload } from './ThumbnailDownloadProvider';
export { default as useDownload } from './useDownload';
export { useDownloadScanFlag } from './useDownloadScanFeatureFlag';

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
    const { getCachedChildren, loadChildren } = useLinksListing();
    const { initDownload } = useDownload({ loadChildren, getCachedChildren });
    const [user] = useUser();

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            {children}
        </DownloadProvider>
    );
}

export function PublicDownloadsProvider({ children }: { children: React.ReactNode }) {
    const { user, request } = usePublicSession();

    const { getCachedChildren, loadChildren } = usePublicLinksListing();
    const { initDownload } = useDownload({
        customDebouncedRequest: request,
        getCachedChildren,
        loadChildren,
    });

    return (
        <DownloadProvider user={user} initDownload={initDownload}>
            {children}
        </DownloadProvider>
    );
}

export * from './interface';
