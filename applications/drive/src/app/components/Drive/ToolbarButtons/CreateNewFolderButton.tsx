import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import useDrive from '../../../hooks/drive/useDrive';
import CreateFolderModal from '../../CreateFolderModal';
import { DriveFolder } from '../DriveFolderProvider';

interface Props {
    activeFolder: DriveFolder;
    disabled?: boolean;
    className?: string;
}

const CreateNewFolderButton = ({ activeFolder, disabled, className }: Props) => {
    const { createModal } = useModals();
    const { createNewFolder, events } = useDrive();

    const { linkId, shareId } = activeFolder;

    const handleCreateFolder = async () => {
        createModal(
            <CreateFolderModal
                createNewFolder={async (name) => {
                    await createNewFolder(shareId, linkId, name);
                    events.call(shareId);
                }}
            />
        );
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            icon="folder-new"
            title={c('Action').t`New Folder`}
            onClick={handleCreateFolder}
        />
    );
};

export default CreateNewFolderButton;
