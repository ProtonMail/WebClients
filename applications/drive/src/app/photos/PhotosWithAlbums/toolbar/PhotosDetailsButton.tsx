import { c } from 'ttag';

import { DropdownMenuButton, ToolbarButton } from '@proton/components';
import { generateNodeUid, getDriveForPhotos } from '@proton/drive';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import { useDetailsModal } from '../../../modals/DetailsModal';
import type { PhotoLink } from '../../../store';

interface Props {
    selectedLinks: PhotoLink[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosDetailsButton = ({ selectedLinks, showIconOnly, dropDownMenuButton = false }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();

    const link = selectedLinks[0];

    if (!link) {
        return null;
    }

    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <>
            <ButtonComp
                title={c('Action').t`Details`}
                onClick={() => {
                    if (selectedLinks.length === 1) {
                        void showDetailsModal({
                            drive: getDriveForPhotos(),
                            nodeUid: generateNodeUid(selectedLinks[0].volumeId, selectedLinks[0].linkId),
                        });
                    } else {
                        void showFilesDetailsModal({ selectedItems: selectedLinks });
                    }
                }}
                data-testid="toolbar-details"
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <IcInfoCircle className={clsx(!showIconOnly && 'mr-2')} />
                <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Details`}</span>
            </ButtonComp>
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default PhotosDetailsButton;
