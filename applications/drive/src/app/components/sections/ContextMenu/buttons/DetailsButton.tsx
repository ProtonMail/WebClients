import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLinks: DecryptedLink[];
    showDetailsModal: ReturnType<typeof useDetailsModal>[1];
    showFilesDetailsModal: ReturnType<typeof useFilesDetailsModal>[1];
    close: () => void;
}

const DetailsButton = ({ selectedLinks, showDetailsModal, showFilesDetailsModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => {
                if (selectedLinks.length === 1) {
                    void showDetailsModal({ shareId: selectedLinks[0].rootShareId, linkId: selectedLinks[0].linkId });
                } else if (selectedLinks.length > 1) {
                    void showFilesDetailsModal({ selectedItems: selectedLinks });
                }
            }}
            close={close}
        />
    );
};

export default DetailsButton;
