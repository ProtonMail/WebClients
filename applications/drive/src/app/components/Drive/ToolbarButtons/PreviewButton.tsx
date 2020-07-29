import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { LinkType } from '../../../interfaces/link';
import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    disabled?: boolean;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const PreviewButton = ({ disabled, openLink }: Props) => {
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
                    preview(selectedItems[0], openLink);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
