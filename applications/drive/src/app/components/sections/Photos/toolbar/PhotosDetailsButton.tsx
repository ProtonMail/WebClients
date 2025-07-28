import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { PhotoLink } from '../../../../store';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';

interface Props {
    selectedLinks: PhotoLink[];
}

const PhotosDetailsButton = ({ selectedLinks }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();

    const link = selectedLinks[0];

    if (!link) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Details`}
                icon={<Icon name="info-circle" alt={c('Action').t`Details`} />}
                onClick={() => {
                    if (selectedLinks.length === 1) {
                        void showDetailsModal({
                            volumeId: selectedLinks[0].volumeId,
                            shareId: selectedLinks[0].rootShareId,
                            linkId: selectedLinks[0].linkId,
                        });
                    } else {
                        void showFilesDetailsModal({ selectedItems: selectedLinks });
                    }
                }}
                data-testid="toolbar-details"
            />
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default PhotosDetailsButton;
