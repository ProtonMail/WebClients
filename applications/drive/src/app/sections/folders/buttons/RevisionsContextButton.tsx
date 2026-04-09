import { c } from 'ttag';

import { getDrive } from '@proton/drive';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useDocumentActions } from '../../../hooks/docs/useDocumentActions';
import type { useRevisionsModal } from '../../../modals/RevisionsModal';

interface Props {
    nodeUid: string;
    mediaType: string;
    rootShareId: string;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>['showRevisionsModal'];
    close: () => void;
}

export const RevisionsContextButton = ({ nodeUid, mediaType, showRevisionsModal, close }: Props) => {
    const { openDocumentHistory } = useDocumentActions();
    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon="clock-rotate-left"
            testId="context-menu-revisions"
            action={() => {
                if (isProtonDocsDocument(mediaType)) {
                    void openDocumentHistory({ type: 'doc', uid: nodeUid });
                } else {
                    // Revision is not supported on photos so we force getDrive
                    showRevisionsModal({ nodeUid, drive: getDrive() });
                }
            }}
            close={close}
        />
    );
};
