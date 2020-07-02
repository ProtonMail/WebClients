import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { useDriveActiveFolder } from '../DriveFolderProvider';
import MoveToFolderModal from '../../MoveToFolderModal';

interface Props {
    disabled?: boolean;
}

const MoveToFolderButton = ({ disabled }: Props) => {
    const { createModal } = useModals();
    const { folder } = useDriveActiveFolder();
    const { fileBrowserControls } = useDriveContent();

    const { selectedItems } = fileBrowserControls;

    const moveToFolder = () => {
        if (!folder || !selectedItems.length) {
            return;
        }

        createModal(<MoveToFolderModal activeFolder={folder} selectedItems={selectedItems} />);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Move to Folder`}
            icon="arrow-cross"
            onClick={moveToFolder}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
