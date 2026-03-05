import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { useRevisionsModal } from '../../../../modals/RevisionsModal';
import { useDocumentActions } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

type RevisionItem = {
    mimeType: string;
    size: number;
    volumeId: string;
    linkId: string;
    rootShareId: string;
    name: string;
    isFile: boolean;
};
interface Props {
    selectedLink: RevisionItem;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>['showRevisionsModal'];
    close: () => void;
}

// legacy version of the revision button, remove it when the legacy section is deleted
export const RevisionsButton = ({ selectedLink, showRevisionsModal, close }: Props) => {
    const { openDocumentHistory } = useDocumentActions();
    const nodeUid = generateNodeUid(selectedLink.volumeId, selectedLink.linkId);
    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon="clock-rotate-left"
            testId="context-menu-revisions"
            action={() => {
                if (isProtonDocsDocument(selectedLink.mimeType)) {
                    void openDocumentHistory({
                        type: 'doc',
                        shareId: selectedLink.rootShareId,
                        linkId: selectedLink.linkId,
                    });
                } else {
                    showRevisionsModal({ nodeUid });
                }
            }}
            close={close}
        />
    );
};
