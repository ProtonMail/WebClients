import { DriveEventManagerProvider } from './events';
import { DownloadsProvider } from './downloads';
import { DownloadSignatureIssueModal } from './downloads/interface';
import { LinksProvider } from './links';
import { SearchProvider } from './search';
import { SharesProvider } from './shares';
import { UploadProvider } from './uploads';
import { UploadConflictModal } from './uploads/interface';

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
