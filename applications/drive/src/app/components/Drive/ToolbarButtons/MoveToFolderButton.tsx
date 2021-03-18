import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    disabled?: boolean;
}

const MoveToFolderButton = ({ disabled }: Props) => {
    const { openMoveToFolder } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Move to folder`}
            icon={<Icon name="arrow-cross" />}
            onClick={() => openMoveToFolder(selectedItems)}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
