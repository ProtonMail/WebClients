import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    disabled?: boolean;
}

const PreviewButton = ({ disabled }: Props) => {
    const { preview } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Preview`}
            icon="read"
            onClick={() => {
                if (selectedItems.length) {
                    preview(selectedItems[0]);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
