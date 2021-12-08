import { DownloadProvider } from './DownloadProvider';
import { ThumbnailsDownloadProvider } from './ThumbnailDownloadProvider';

export { useDownloadProvider } from './DownloadProvider';
export { useThumbnailsDownload } from './ThumbnailDownloadProvider';
export { default as useDownload } from './useDownload';

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
    return (
        <DownloadProvider>
            <ThumbnailsDownloadProvider>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}
