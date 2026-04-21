import { c } from 'ttag';

import { DropdownMenuButton, ToolbarButton } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import type { PhotoItem } from '../../usePhotos.store';

interface Props {
    selectedPhotos: PhotoItem[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosDetailsButton = ({ selectedPhotos, showIconOnly, dropDownMenuButton = false }: Props) => {
    const { filesDetailsModal, showFilesDetailsModal } = useFilesDetailsModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();

    const photo = selectedPhotos[0];

    if (!photo) {
        return null;
    }

    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <>
            <ButtonComp
                title={c('Action').t`Details`}
                onClick={() => {
                    if (selectedPhotos.length === 1) {
                        void showDetailsModal({
                            drive: getDriveForPhotos(),
                            nodeUid: selectedPhotos[0].nodeUid,
                        });
                    } else {
                        void showFilesDetailsModal({
                            nodeUids: selectedPhotos.map((photo) => photo.nodeUid),
                        });
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
