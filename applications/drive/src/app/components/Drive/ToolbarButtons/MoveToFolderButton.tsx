import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { DriveFolder } from '../DriveFolderProvider';
import { FileBrowserItem } from '../../FileBrowser/interfaces';

interface Props {
    sourceFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
}

const MoveToFolderButton = ({ sourceFolder, selectedItems }: Props) => {
    const { openMoveToFolder } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={false}
            title={c('Action').t`Move to folder`}
            icon={<Icon name="arrow-cross" />}
            onClick={() => openMoveToFolder(sourceFolder, selectedItems)}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
