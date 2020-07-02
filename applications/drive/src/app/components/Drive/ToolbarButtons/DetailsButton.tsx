import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import DetailsModal from '../../DetailsModal';
import { useDriveActiveFolder } from '../DriveFolderProvider';

interface Props {
    disabled?: boolean;
}

const DetailsButton = ({ disabled }: Props) => {
    const { createModal } = useModals();
    const { folder: activeFolder } = useDriveActiveFolder();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handleDetailsClick = () => {
        if (!activeFolder || !selectedItems.length) {
            return;
        }

        createModal(<DetailsModal item={selectedItems[0]} activeFolder={activeFolder} />);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Details`}
            icon="info"
            onClick={handleDetailsClick}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
