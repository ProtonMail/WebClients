import { c } from 'ttag';

import { getDrive } from '@proton/drive';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { useRevisionsModal } from '../../../modals/RevisionsModal';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { openDocumentHistory } from '../../../utils/docs/openInDocs';

interface Props {
    nodeUid: string;
    mediaType: string;
    rootShareId: string;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>['showRevisionsModal'];
    close: () => void;
}

export const RevisionsContextButton = ({ nodeUid, mediaType, showRevisionsModal, close }: Props) => {
    const title = c('Action').t`See version history`;

    return (
        <ContextMenuButton
            name={title}
            icon={<IcClockRotateLeft />}
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
