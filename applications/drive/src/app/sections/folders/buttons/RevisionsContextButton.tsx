import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { useRevisionsModal } from '../../../components/modals/RevisionsModal/RevisionsModal';
import type { RevisionItem } from '../../../components/revisions';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useDocumentActions } from '../../../store';

interface Props {
    selectedItem: RevisionItem;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>[1];
    close: () => void;
}

export const RevisionsContextButton = ({ selectedItem, showRevisionsModal, close }: Props) => {
    const { openDocumentHistory } = useDocumentActions();

    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon="clock-rotate-left"
            testId="context-menu-revisions"
            action={() => {
                if (isProtonDocsDocument(selectedItem.mimeType)) {
                    void openDocumentHistory({
                        type: 'doc',
                        shareId: selectedItem.rootShareId,
                        linkId: selectedItem.linkId,
                    });
                } else {
                    showRevisionsModal({ link: selectedItem });
                }
            }}
            close={close}
        />
    );
};
