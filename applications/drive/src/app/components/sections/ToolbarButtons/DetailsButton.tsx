import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { noSelection } from './utils';

interface Props {
    selectedBrowserItems: {
        volumeId: string;
        rootShareId: string;
        linkId: string;
        isBookmark?: boolean;
        isInvitation?: boolean;
    }[];
}

const DetailsButton = ({ selectedBrowserItems }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();

    if (noSelection(selectedBrowserItems)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Details`}
                icon={<IcInfoCircle alt={c('Action').t`Details`} />}
                onClick={() => {
                    if (selectedBrowserItems.length === 1) {
                        void showDetailsModal({
                            nodeUid: generateNodeUid(selectedBrowserItems[0].volumeId, selectedBrowserItems[0].linkId),
                        });
                    } else if (selectedBrowserItems.length > 1) {
                        void showFilesDetailsModal({ selectedItems: selectedBrowserItems });
                    }
                }}
                data-testid="toolbar-details"
            />
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default DetailsButton;
