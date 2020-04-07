import React from 'react';
import { c, msgid } from 'ttag';

import { Toolbar, ToolbarButton, useNotifications, useModals, Alert } from 'react-components';

import useDrive from '../../../hooks/useDrive';
import useFileBrowser from '../../FileBrowser/useFileBrowser';
import useTrash from '../../../hooks/useTrash';
import { ResourceType } from '../../../interfaces/link';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import ConfirmDeleteModal from '../../ConfirmDeleteModal';

interface Props {
    shareId?: string;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
}

const TrashToolbar = ({ shareId, fileBrowserControls }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { events } = useDrive();
    const { restoreLink, deleteLink, emptyTrash } = useTrash();
    const cache = useDriveCache();
    const trashItems = shareId ? cache.get.shareTrashMetas(shareId) : [];
    const { selectedItems } = fileBrowserControls;

    const handleActionForSelectedItems = async (
        message: string,
        action: (shareId: string, linkId: string) => Promise<unknown>
    ) => {
        const toTakeAction = selectedItems;
        const [{ Name: firstItemName }] = toTakeAction;

        if (shareId) {
            const results = await Promise.all(
                toTakeAction.map((item) =>
                    action(shareId, item.LinkID).then(
                        () => ({ state: 'resolved' }),
                        () => ({ state: 'rejected' })
                    )
                )
            );

            const resolvedCount = results.filter((p) => p.state === 'resolved').length;

            if (resolvedCount > 0) {
                const allFiles = toTakeAction.every(({ Type }) => Type === ResourceType.FILE);
                const allFolders = toTakeAction.every(({ Type }) => Type === ResourceType.FOLDER);
                const notificationTexts = {
                    allFiles: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} files ${message}`,
                        resolvedCount
                    ),
                    allFolders: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} folders ${message}`,
                        resolvedCount
                    ),
                    mixed: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} items ${message}`,
                        resolvedCount
                    )
                };

                const notificationText =
                    (allFiles && notificationTexts.allFiles) ||
                    (allFolders && notificationTexts.allFolders) ||
                    notificationTexts.mixed;

                createNotification({ text: notificationText });
                await events.call(shareId);
            }
        }
    };

    const handleEmptyTrash = async (shareId: string) => {
        await emptyTrash(shareId);

        const notificationText = c('Notification').t`All the items are permanently deleted from Trash.`;
        createNotification({ text: notificationText });
        events.call(shareId);
    };

    const openConfirmModal = (title: string, confirm: string, message: string, onConfirm: () => void) => {
        const content = (
            <>
                {c('Info').t`Are you sure you want to ${message}?`}
                <br />
                {c('Info').t`You cannot undo this action.`}
            </>
        );
        createModal(
            <ConfirmDeleteModal
                title={c('Title').t`${title}`}
                confirm={c('Action').t`${confirm}`}
                onConfirm={onConfirm}
            >
                <Alert type="error">{content}</Alert>
            </ConfirmDeleteModal>
        );
    };

    const handleRestoreClick = async () => {
        handleActionForSelectedItems('restored from Trash', restoreLink);
    };

    const handleDeleteClick = async () => {
        if (shareId) {
            const message = 'permanently delete selected item(s) from Trash';
            openConfirmModal('Delete Permanently', 'Delete Permanently', message, () =>
                handleActionForSelectedItems('deleted from Trash', deleteLink)
            );
        }
    };

    const handleEmptyTrashClick = async () => {
        if (shareId) {
            const message = 'empty Trash and permanently delete all the items';
            openConfirmModal('Empty Trash', 'Empty Trash', message, () => handleEmptyTrash(shareId));
        }
    };

    return (
        <Toolbar>
            {
                <>
                    <ToolbarButton
                        disabled={!selectedItems.length}
                        title={c('Action').t`Restore from Trash`}
                        icon="calendar-repeat"
                        onClick={handleRestoreClick}
                    />
                    <ToolbarButton
                        disabled={!selectedItems.length}
                        title={c('Action').t`Delete Permanently`}
                        icon="trash"
                        onClick={handleDeleteClick}
                    />
                </>
            }
            {
                <ToolbarButton
                    className="mlauto"
                    disabled={!trashItems.length}
                    title={c('Action').t`Empty Trash`}
                    onClick={handleEmptyTrashClick}
                    icon="delete"
                />
            }
        </Toolbar>
    );
};

export default TrashToolbar;
