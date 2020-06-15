import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useModals } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import RenameModal from '../../RenameModal';
import useDrive from '../../../hooks/drive/useDrive';

interface Props {
    shareId: string;
    disabled?: boolean;
    className?: string;
}

const RenameButton = ({ shareId, disabled, className }: Props) => {
    const { createModal } = useModals();
    const { renameLink, events } = useDrive();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handleRename = () => {
        if (!selectedItems.length) {
            return;
        }

        const item = selectedItems[0];
        createModal(
            <RenameModal
                item={item}
                renameLink={async (name) => {
                    await renameLink(shareId, item.LinkID, item.ParentLinkID, name, item.Type);
                    events.call(shareId);
                }}
            />
        );
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            title={c('Action').t`Rename`}
            icon="file-edit"
            onClick={handleRename}
        />
    );
};

export default RenameButton;
