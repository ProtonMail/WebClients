import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useDriveContent } from '../DriveContentProvider';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const GetSecureLinkButton = ({ shareId, disabled }: Props) => {
    const { openLinkSharing } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Get secure link`}
            icon="link"
            onClick={() => openLinkSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default GetSecureLinkButton;
