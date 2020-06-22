import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { LinkType } from '../../../interfaces/link';

interface Props {
    shareId: string;
    disabled?: boolean;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const PreviewButton = ({ shareId, disabled, openLink }: Props) => {
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handlePreview = () => {
        if (!selectedItems.length) {
            return;
        }

        const item = selectedItems[0];
        openLink(shareId, item.LinkID, item.Type);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Preview`}
            icon="read"
            onClick={handlePreview}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
