import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveSDKTransfer } from '../../../../flags/useFlagsDriveSDKTransfer';
import { DownloadManager } from '../../../../managers/download/DownloadManager';
import type { LinkDownload } from '../../../../store';
import { useDownload } from '../../../../store';
import { useDocumentActions } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface SelectedBrowserItem extends Omit<LinkDownload, 'shareId'> {
    rootShareId: string;
    mimeType: string;
}
interface Props {
    selectedBrowserItems: SelectedBrowserItem[];
    close: () => void;
}

const DownloadButton = ({ selectedBrowserItems, close }: Props) => {
    const { download } = useDownload();
    const { downloadDocument } = useDocumentActions();
    const dm = DownloadManager.getInstance();
    const isSDKTransferEnabled = useFlagsDriveSDKTransfer({ isForPhotos: false });
    const onClick = async () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        if (selectedBrowserItems.length === 1) {
            const item = selectedBrowserItems[0];
            if (isProtonDocsDocument(item.mimeType)) {
                void downloadDocument({
                    type: 'doc',
                    shareId: item.rootShareId,
                    linkId: item.linkId,
                });
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                void downloadDocument({
                    type: 'sheet',
                    shareId: item.rootShareId,
                    linkId: item.linkId,
                });
                return;
            }
        }

        if (isSDKTransferEnabled) {
            void dm.download(selectedBrowserItems.map((item) => generateNodeUid(item.volumeId, item.linkId)));
        } else {
            void download(
                selectedBrowserItems.map((link) => ({
                    ...link,
                    shareId: link.rootShareId,
                }))
            );
        }
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-line"
            testId="context-menu-download"
            action={onClick}
            close={close}
        />
    );
};

export default DownloadButton;
