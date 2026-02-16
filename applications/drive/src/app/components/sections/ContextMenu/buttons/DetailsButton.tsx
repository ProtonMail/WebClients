import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';

import type { useDetailsModal } from '../../../../modals/DetailsModal/';
import type { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedBrowserItems: { volumeId: string; rootShareId: string; linkId: string }[];
    showDetailsModal: ReturnType<typeof useDetailsModal>['showDetailsModal'];
    showFilesDetailsModal: ReturnType<typeof useFilesDetailsModal>[1];
    close: () => void;
}

const DetailsButton = ({ selectedBrowserItems, showDetailsModal, showFilesDetailsModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => {
                if (selectedBrowserItems.length === 1) {
                    void showDetailsModal({
                        nodeUid: generateNodeUid(selectedBrowserItems[0].volumeId, selectedBrowserItems[0].linkId),
                    });
                } else if (selectedBrowserItems.length > 1) {
                    void showFilesDetailsModal({ selectedItems: selectedBrowserItems });
                }
            }}
            close={close}
        />
    );
};

export default DetailsButton;
