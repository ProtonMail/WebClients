import { DownloadSignatureIssueModal } from './interface';
import { DownloadProvider } from './DownloadProvider';
import { ThumbnailsDownloadProvider } from './ThumbnailDownloadProvider';

export { useDownloadProvider } from './DownloadProvider';
export { useThumbnailsDownload } from './ThumbnailDownloadProvider';
export { default as useDownload } from './useDownload';

export function DownloadsProvider({
    DownloadSignatureIssueModal,
    children,
}: {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    children: React.ReactNode;
}) {
    return (
        <DownloadProvider DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
            <ThumbnailsDownloadProvider>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}
