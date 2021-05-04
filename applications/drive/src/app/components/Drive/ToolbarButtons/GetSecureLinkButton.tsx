import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

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

    const hasSharedLink = !!selectedItems[0]?.SharedUrl;

    return (
        <ToolbarButton
            disabled={disabled}
            title={hasSharedLink ? c('Action').t`Sharing options` : c('Action').t`Share via link`}
            icon={<Icon name="link" />}
            onClick={() => openLinkSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default GetSecureLinkButton;
