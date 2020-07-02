import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { LinkType } from '../../../interfaces/link';
import { useDriveActiveFolder } from '../DriveFolderProvider';

interface Props {
    disabled?: boolean;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const PreviewButton = ({ disabled, openLink }: Props) => {
    const { folder } = useDriveActiveFolder();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handlePreview = () => {
        if (!folder || !selectedItems.length) {
            return;
        }

        const item = selectedItems[0];
        openLink(folder.shareId, item.LinkID, item.Type);
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
