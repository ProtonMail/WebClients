import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import CreateFolderModal from '../../CreateFolderModal';

interface Props {
    disabled?: boolean;
}

const CreateNewFolderButton = ({ disabled }: Props) => {
    const { createModal } = useModals();

    const handleCreateFolder = async () => {
        createModal(<CreateFolderModal />);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            icon="folder-new"
            title={c('Action').t`New Folder`}
            onClick={handleCreateFolder}
            data-testid="toolbar-new-folder"
        />
    );
};

export default CreateNewFolderButton;
