import { DriveEventManagerProvider } from './events';
import { DownloadsProvider } from './downloads';
import { LinksProvider } from './links';
import { SharesProvider } from './shares';
import { UploadProvider } from './uploads';
import { UploadConflictModal } from './uploads/interface';

interface Props {
    UploadConflictModal: UploadConflictModal;
    children: React.ReactNode;
}

export default function DriveProvider({ UploadConflictModal, children }: Props) {
    return (
        <DriveEventManagerProvider>
            <SharesProvider>
                <LinksProvider>
                    <DownloadsProvider>
                        <UploadProvider UploadConflictModal={UploadConflictModal}>{children}</UploadProvider>
                    </DownloadsProvider>
                </LinksProvider>
            </SharesProvider>
        </DriveEventManagerProvider>
    );
}
