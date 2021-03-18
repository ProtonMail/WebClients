import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

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
            icon={<Icon name="download" />}
            onClick={() => download(selectedItems)}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
