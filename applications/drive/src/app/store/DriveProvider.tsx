import { PublicSessionProvider } from './_api';
import { DevicesProvider } from './_devices';
import { DownloadsProvider, PublicDownloadsProvider } from './_downloads';
import { DownloadSignatureIssueModal } from './_downloads/interface';
import { DriveEventManagerProvider } from './_events';
import { LinksProvider, PublicLinksProvider } from './_links';
import { SearchProvider } from './_search';
import { SharesProvider } from './_shares';
import { UploadProvider } from './_uploads';
import { UploadConflictModal } from './_uploads/interface';

interface DriveProviderProps {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    UploadConflictModal: UploadConflictModal;
    children: React.ReactNode;
}

export function DriveProvider({ DownloadSignatureIssueModal, UploadConflictModal, children }: DriveProviderProps) {
    return (
        <DriveEventManagerProvider>
            <SharesProvider>
                <LinksProvider>
                    <DevicesProvider>
                        <DownloadsProvider DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
                            <UploadProvider UploadConflictModal={UploadConflictModal}>
                                <SearchProvider>{children}</SearchProvider>
                            </UploadProvider>
                        </DownloadsProvider>
                    </DevicesProvider>
                </LinksProvider>
            </SharesProvider>
        </DriveEventManagerProvider>
    );
}

interface PublicDriveProviderProps {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    children: React.ReactNode;
}

export function PublicDriveProvider({ DownloadSignatureIssueModal, children }: PublicDriveProviderProps) {
    return (
        <PublicSessionProvider>
            <SharesProvider>
                <PublicLinksProvider>
                    <PublicDownloadsProvider DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
                        {children}
                    </PublicDownloadsProvider>
                </PublicLinksProvider>
            </SharesProvider>
        </PublicSessionProvider>
    );
}
