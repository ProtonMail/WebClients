import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useLoading } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import useTrash from '../../../hooks/drive/useTrash';
import useDrive from '../../../hooks/drive/useDrive';
import useListNotifications from '../../../hooks/util/useListNotifications';
import { DriveFolder } from '../DriveFolderProvider';

interface Props {
    activeFolder: DriveFolder;
    disabled?: boolean;
    className?: string;
}

const MoveToTrashButton = ({ activeFolder, disabled, className }: Props) => {
    const { events } = useDrive();
    const { trashLinks, restoreLinks } = useTrash();
    const [moveToTrashLoading, withMoveToTrashLoading] = useLoading();
    const { createRestoredLinksNotifications, createTrashLinksNotifications } = useListNotifications();
    const { fileBrowserControls } = useDriveContent();

    const { selectedItems } = fileBrowserControls;
    const { linkId, shareId } = activeFolder;

    const moveToTrash = async () => {
        if (!selectedItems.length) {
            return;
        }

        const toTrash = selectedItems;
        const trashed = await trashLinks(
            shareId,
            linkId,
            toTrash.map(({ LinkID }) => LinkID)
        );

        const undoAction = async () => {
            const result = await restoreLinks(
                shareId,
                toTrash.map(({ LinkID }) => LinkID)
            );
            createRestoredLinksNotifications(toTrash, result);
            await events.call(shareId);
        };

        createTrashLinksNotifications(toTrash, trashed, undoAction);

        await events.call(shareId);
    };

    return (
        <ToolbarButton
            disabled={disabled || moveToTrashLoading}
            className={className}
            title={c('Action').t`Move to Trash`}
            icon="trash"
            onClick={() => withMoveToTrashLoading(moveToTrash())}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
