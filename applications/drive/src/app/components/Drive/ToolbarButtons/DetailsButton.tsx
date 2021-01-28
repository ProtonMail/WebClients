import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    disabled?: boolean;
}

const DetailsButton = ({ disabled }: Props) => {
    const { openDetails, openFilesDetails } = useToolbarActions();

    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Details`}
            icon="info"
            onClick={() => {
                if (selectedItems.length === 1) {
                    openDetails(selectedItems[0]);
                } else if (selectedItems.length > 1) {
                    openFilesDetails(selectedItems);
                }
            }}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
