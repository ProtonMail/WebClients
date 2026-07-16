import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import type { useDetailsModal } from '../../../../../modals/DetailsModal/';
import type { useFilesDetailsModal } from '../../../../../modals/FilesDetailsModal';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    selectedBrowserItems: { volumeId: string; rootShareId: string; linkId: string }[];
    showDetailsModal: ReturnType<typeof useDetailsModal>['showDetailsModal'];
    showFilesDetailsModal: ReturnType<typeof useFilesDetailsModal>['showFilesDetailsModal'];
    close: () => void;
}

const DetailsButton = ({ selectedBrowserItems, showDetailsModal, showFilesDetailsModal, close }: Props) => {
    const title = c('Action').t`Details`;

    return (
        <ContextMenuButton
            name={title}
            icon={<IcInfoCircle />}
            testId="context-menu-details"
            action={() => {
                if (selectedBrowserItems.length === 1) {
                    void showDetailsModal({
                        nodeUid: generateNodeUid(selectedBrowserItems[0].volumeId, selectedBrowserItems[0].linkId),
                    });
                } else if (selectedBrowserItems.length > 1) {
                    void showFilesDetailsModal({
                        nodeUids: selectedBrowserItems.map((item) => generateNodeUid(item.volumeId, item.linkId)),
                    });
                }
            }}
            close={close}
        />
    );
};

export default DetailsButton;
