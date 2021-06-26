import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { DriveFolder } from '../DriveFolderProvider';
import { FileBrowserItem } from '../../FileBrowser/interfaces';

interface Props {
    sourceFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
}

const MoveToTrashButton = ({ sourceFolder, selectedItems }: Props) => {
    const [moveToTrashLoading, withMoveToTrashLoading] = useLoading();
    const { openMoveToTrash } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={moveToTrashLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" />}
            onClick={() => withMoveToTrashLoading(openMoveToTrash(sourceFolder, selectedItems))}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
