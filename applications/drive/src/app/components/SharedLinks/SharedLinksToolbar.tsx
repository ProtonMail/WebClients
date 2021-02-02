import React from 'react';
import { Toolbar, ToolbarSeparator } from 'react-components';

import { useSharedLinksContent } from './SharedLinksContentProvider';
import ManageSecureLinkButton from './ToolbarButtons/ManageSecureLinkButton';
import StopSharingButton from './ToolbarButtons/StopSharingButton';

interface Props {
    shareId: string;
}

const SharedLinksToolbar = ({ shareId }: Props) => {
    const { fileBrowserControls } = useSharedLinksContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <Toolbar>
            <ManageSecureLinkButton shareId={shareId} disabled={selectedItems.length !== 1} />
            <ToolbarSeparator />
            <StopSharingButton shareId={shareId} disabled={!selectedItems.length} />
            <ToolbarSeparator />
        </Toolbar>
    );
};

export default SharedLinksToolbar;
