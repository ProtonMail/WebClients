import { c } from 'ttag';

import { splitNodeUid } from '@proton/drive/index';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { useRevisionsModal } from '../../../modals/RevisionsModal';
import { useDocumentActions } from '../../../store';

interface Props {
    nodeUid: string;
    mediaType: string;
    rootShareId: string;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>['showRevisionsModal'];
    close: () => void;
}

export const RevisionsContextButton = ({ nodeUid, mediaType, rootShareId, showRevisionsModal, close }: Props) => {
    const { openDocumentHistory } = useDocumentActions();
    const { nodeId } = splitNodeUid(nodeUid);
    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon="clock-rotate-left"
            testId="context-menu-revisions"
            action={() => {
                if (isProtonDocsDocument(mediaType)) {
                    void openDocumentHistory({
                        type: 'doc',
                        shareId: rootShareId,
                        linkId: nodeId,
                    });
                } else {
                    showRevisionsModal({ nodeUid });
                }
            }}
            close={close}
        />
    );
};
