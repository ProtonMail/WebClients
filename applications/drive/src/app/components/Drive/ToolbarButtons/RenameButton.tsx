import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    disabled?: boolean;
}

const RenameButton = ({ disabled }: Props) => {
    const { openRename } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Rename`}
            icon="file-edit"
            onClick={() => {
                if (selectedItems.length) {
                    openRename(selectedItems[0]);
                }
            }}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
