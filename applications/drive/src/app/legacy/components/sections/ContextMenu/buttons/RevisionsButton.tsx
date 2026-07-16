import { c } from 'ttag';

import { generateNodeUid, getDrive } from '@proton/drive';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { useRevisionsModal } from '../../../../../modals/RevisionsModal';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';
import { openDocumentHistory } from '../../../../../utils/docs/openInDocs';

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
    const nodeUid = generateNodeUid(selectedLink.volumeId, selectedLink.linkId);
    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon={<IcClockRotateLeft />}
            testId="context-menu-revisions"
            action={() => {
                if (isProtonDocsDocument(selectedLink.mimeType)) {
                    void openDocumentHistory({
                        uid: nodeUid,
                        type: 'doc',
                    });
                } else {
                    // Legacy so we force getDrive
                    showRevisionsModal({ nodeUid, drive: getDrive() });
                }
            }}
            close={close}
        />
    );
};
