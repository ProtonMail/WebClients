import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useDetailsModal } from '../../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import type { PhotoLink } from '../../../store';

interface Props {
    selectedLinks: PhotoLink[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosDetailsButton = ({ selectedLinks, showIconOnly, dropDownMenuButton = false }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();

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
                            volumeId: selectedLinks[0].volumeId,
                            shareId: selectedLinks[0].rootShareId,
                            linkId: selectedLinks[0].linkId,
                        });
                    } else {
                        void showFilesDetailsModal({ selectedItems: selectedLinks });
                    }
                }}
                data-testid="toolbar-details"
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name="info-circle" className={clsx(!showIconOnly && 'mr-2')} />
                <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Details`}</span>
            </ButtonComp>
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default PhotosDetailsButton;
