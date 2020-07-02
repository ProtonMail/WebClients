import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import RenameModal from '../../RenameModal';
import { useDriveActiveFolder } from '../DriveFolderProvider';

interface Props {
    disabled?: boolean;
}

const RenameButton = ({ disabled }: Props) => {
    const { createModal } = useModals();
    const { fileBrowserControls } = useDriveContent();
    const { folder } = useDriveActiveFolder();
    const { selectedItems } = fileBrowserControls;

    const handleRename = () => {
        if (!folder || !selectedItems.length) {
            return;
        }

        const item = selectedItems[0];
        createModal(<RenameModal activeFolder={folder} item={item} />);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Rename`}
            icon="file-edit"
            onClick={handleRename}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
