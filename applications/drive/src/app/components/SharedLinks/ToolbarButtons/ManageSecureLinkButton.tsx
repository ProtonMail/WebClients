import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useSharedLinksContent } from '../SharedLinksContentProvider';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const ManageSecureLinkButton = ({ shareId, disabled }: Props) => {
    const { openLinkSharing } = useToolbarActions();
    const { fileBrowserControls } = useSharedLinksContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Sharing options`}
            icon="link"
            onClick={() => openLinkSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default ManageSecureLinkButton;
