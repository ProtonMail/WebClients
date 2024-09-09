import { c } from 'ttag';

import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../../../../store';
import { useDocumentActions } from '../../../../store/_documents';
import type { useRevisionsModal } from '../../../modals/RevisionsModal/RevisionsModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLink: DecryptedLink;
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
                if (isProtonDocument(selectedLink.mimeType)) {
                    void openDocumentHistory({
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
