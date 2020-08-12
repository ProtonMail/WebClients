import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    disabled?: boolean;
}

const CreateNewFolderButton = ({ disabled }: Props) => {
    const { openCreateFolder } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={disabled}
            icon="folder-new"
            title={c('Action').t`Create New Folder`}
            onClick={openCreateFolder}
            data-testid="toolbar-new-folder"
        />
    );
};

export default CreateNewFolderButton;
