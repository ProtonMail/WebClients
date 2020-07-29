import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    disabled?: boolean;
}

const DownloadButton = ({ disabled }: Props) => {
    const { download } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Download`}
            icon="download"
            onClick={() => download(selectedItems)}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
