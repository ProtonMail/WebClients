import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useDocumentActions } from '../../../../store/_documents';
import type { useRevisionsModal } from '../../../modals/RevisionsModal/RevisionsModal';
import type { RevisionItem } from '../../../revisions';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLink: RevisionItem;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>[1];
    close: () => void;
}

const RevisionsButton = ({ selectedLink, showRevisionsModal, close }: Props) => {
    const { openDocumentHistory } = useDocumentActions();

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
                    showRevisionsModal({ link: selectedLink });
                }
            }}
            close={close}
        />
    );
};

export default RevisionsButton;
