import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    disabled?: boolean;
}

const MoveToTrashButton = ({ disabled }: Props) => {
    const [moveToTrashLoading, withMoveToTrashLoading] = useLoading();
    const { openMoveToTrash } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled || moveToTrashLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" />}
            onClick={() => withMoveToTrashLoading(openMoveToTrash(selectedItems))}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
