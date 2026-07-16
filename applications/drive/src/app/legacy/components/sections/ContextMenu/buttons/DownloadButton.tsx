import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import type { LinkDownload } from '../../../../../legacy/store';
import { DownloadManager } from '../../../../../modules/download/DownloadManager';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';
import { downloadDocument } from '../../../../../utils/docs/openInDocs';

interface SelectedBrowserItem extends Omit<LinkDownload, 'shareId'> {
    rootShareId: string;
    mimeType: string;
}
interface Props {
    selectedBrowserItems: SelectedBrowserItem[];
    close: () => void;
}

const DownloadButton = ({ selectedBrowserItems, close }: Props) => {
    const dm = DownloadManager.getInstance();
    const title = c('Action').t`Download`;

    const onClick = async () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        if (selectedBrowserItems.length === 1) {
            const item = selectedBrowserItems[0];
            if (isProtonDocsDocument(item.mimeType)) {
                void downloadDocument({ uid: generateNodeUid(item.volumeId, item.linkId), type: 'doc' });
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                void downloadDocument({ uid: generateNodeUid(item.volumeId, item.linkId), type: 'sheet' });
                return;
            }
        }

        void dm.download(selectedBrowserItems.map((item) => generateNodeUid(item.volumeId, item.linkId)));
    };

    return (
        <ContextMenuButton
            name={title}
            icon={<IcArrowDownLine />}
            testId="context-menu-download"
            action={onClick}
            close={close}
        />
    );
};

export default DownloadButton;
