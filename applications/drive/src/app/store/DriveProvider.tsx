import { DriveEventManagerProvider } from './_events';
import { DownloadsProvider } from './_downloads';
import { DownloadSignatureIssueModal } from './_downloads/interface';
import { LinksProvider } from './_links';
import { SearchProvider } from './_search';
import { SharesProvider } from './_shares';
import { UploadProvider } from './_uploads';
import { UploadConflictModal } from './_uploads/interface';

interface Props {
    DownloadSignatureIssueModal: DownloadSignatureIssueModal;
    UploadConflictModal: UploadConflictModal;
    children: React.ReactNode;
}

export default function DriveProvider({ DownloadSignatureIssueModal, UploadConflictModal, children }: Props) {
    return (
        <DriveEventManagerProvider>
            <SharesProvider>
                <LinksProvider>
                    <DownloadsProvider DownloadSignatureIssueModal={DownloadSignatureIssueModal}>
                        <UploadProvider UploadConflictModal={UploadConflictModal}>
                            <SearchProvider>{children}</SearchProvider>
                        </UploadProvider>
                    </DownloadsProvider>
                </LinksProvider>
            </SharesProvider>
        </DriveEventManagerProvider>
    );
}
