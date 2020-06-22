import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import useDrive from '../../../hooks/drive/useDrive';
import DetailsModal from '../../DetailsModal';
import { DriveFolder } from '../DriveFolderProvider';

interface Props {
    activeFolder: DriveFolder;
    disabled?: boolean;
    className?: string;
}

const DetailsButton = ({ activeFolder, disabled, className }: Props) => {
    const { createModal } = useModals();
    const { getLinkMeta } = useDrive();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handleDetailsClick = () => {
        if (!selectedItems.length) {
            return;
        }

        createModal(<DetailsModal item={selectedItems[0]} activeFolder={activeFolder} getLinkMeta={getLinkMeta} />);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            title={c('Action').t`Details`}
            icon="info"
            onClick={handleDetailsClick}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
