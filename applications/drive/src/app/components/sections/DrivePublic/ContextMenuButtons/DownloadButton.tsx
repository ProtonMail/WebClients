import { c } from 'ttag';

import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import usePublicToken from '../../../../hooks/drive/usePublicToken';
import type { LinkDownload } from '../../../../store';
import { useDownload } from '../../../../store';
import { useDocumentActions } from '../../../../store/_documents';
import { ContextMenuButton } from '../../ContextMenu';

interface SelectedBrowserItem extends Omit<LinkDownload, 'shareId'> {
    rootShareId: string;
    mimeType: string;
}
interface Props {
    selectedBrowserItems: SelectedBrowserItem[];
    close: () => void;
}
export const DownloadButton = ({ selectedBrowserItems, close }: Props) => {
    const { download } = useDownload();
    const { token } = usePublicToken();
    const { downloadDocument } = useDocumentActions();

    const onClick = async () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        const documentLink =
            selectedBrowserItems.length === 1 && isProtonDocument(selectedBrowserItems[0].mimeType)
                ? selectedBrowserItems[0]
                : undefined;

        if (documentLink) {
            void downloadDocument({
                shareId: token,
                linkId: documentLink.linkId,
            });
            return;
        }

        void download(
            selectedBrowserItems.map((link) => ({
                ...link,
                shareId: token,
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
