import { DownloadSignatureIssueModal } from './interface';
import { DownloadProvider } from './DownloadProvider';
import { ThumbnailsDownloadProvider } from './ThumbnailDownloadProvider';
import useDownload from './useDownload';
import usePublicDownload from './usePublicDownload';

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
    const { initDownload } = useDownload();
    return (
        <DownloadProvider initDownload={initDownload} DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
            <ThumbnailsDownloadProvider>{children}</ThumbnailsDownloadProvider>
        </DownloadProvider>
    );
}

export function PublicDownloadsProvider({
    DownloadSignatureIssueModal,
    children,
}: {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    children: React.ReactNode;
}) {
    const { initDownload } = usePublicDownload();
    return (
        <DownloadProvider initDownload={initDownload} DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
            {children}
        </DownloadProvider>
    );
}

export * from './interface';
