import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    disabled?: boolean;
}

const CreateNewFolderButton = ({ disabled }: Props) => {
    const { openCreateFolder } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={disabled}
            icon={<Icon name="folder-new" />}
            title={c('Action').t`Create new folder`}
            onClick={openCreateFolder}
            data-testid="toolbar-new-folder"
        />
    );
};

export default CreateNewFolderButton;
