import { c } from 'ttag';

import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { DecryptedLink, useDownload } from '../../../../store';
import { useDocumentActions } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const DownloadButton = ({ selectedLinks, close }: Props) => {
    const { download } = useDownload();
    const { downloadDocument } = useDocumentActions();

    const onClick = () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        const documentLink =
            selectedLinks.length === 1 && isProtonDocument(selectedLinks[0].mimeType) ? selectedLinks[0] : undefined;

        if (documentLink) {
            void downloadDocument({
                shareId: documentLink.rootShareId,
                linkId: documentLink.linkId,
            });
            return;
        }

        void download(
            selectedLinks.map((link) => ({
                ...link,
                shareId: link.rootShareId,
            }))
        );
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
