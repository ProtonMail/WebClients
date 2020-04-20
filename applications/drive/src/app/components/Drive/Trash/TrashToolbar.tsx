import React from 'react';
import { c, msgid } from 'ttag';

import { Toolbar, ToolbarButton, useNotifications, useModals, Alert, useLoading } from 'react-components';

import useDrive from '../../../hooks/useDrive';
import useTrash from '../../../hooks/useTrash';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import ConfirmDeleteModal from '../../ConfirmDeleteModal';
import { FileBrowserItem } from '../../FileBrowser/FileBrowser';
import { getNotificationTextForItemList, takeActionForAllItems } from '../helpers';
import { useTrashContent } from './TrashContentProvider';

interface Props {
    shareId?: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { events } = useDrive();
    const { restoreLink, deleteLink, emptyTrash } = useTrash();
    const [restoreLoading, withRestoreLoading] = useLoading();
    const cache = useDriveCache();
    const { fileBrowserControls } = useTrashContent();

    const { selectedItems } = fileBrowserControls;
    const trashItems = shareId ? cache.get.trashMetas(shareId) : [];

    const openConfirmModal = (title: string, confirm: string, message: string, onConfirm: () => void) => {
        const content = (
            <>
                {c('Info').t`Are you sure you want to ${message}?`}
                <br />
                {c('Info').t`You cannot undo this action.`}
            </>
        );

        createModal(
            <ConfirmDeleteModal title={title} confirm={confirm} onConfirm={onConfirm}>
                <Alert type="error">{content}</Alert>
            </ConfirmDeleteModal>
        );
    };

    const restoreFromTrash = async () => {
        if (!shareId) {
            return;
        }

        const toRestore = selectedItems;
        const restoredItems = await takeActionForAllItems(toRestore, (item: FileBrowserItem) =>
            restoreLink(shareId, item.LinkID)
        );

        const restoredItemsCount = restoredItems.length;
        if (!restoredItemsCount) {
            return;
        }

        const [{ Name: firstItemName }] = restoredItems;
        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" restored from Trash`,
                `${restoredItemsCount} files restored from Trash`,
                restoredItemsCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" restored from Trash`,
                `${restoredItemsCount} folders restored from Trash`,
                restoredItemsCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" restored from Trash`,
                `${restoredItemsCount} items restored from Trash`,
                restoredItemsCount
            )
        };

        const notificationText = getNotificationTextForItemList(restoredItems, notificationMessages);
        createNotification({ text: notificationText });
        await events.call(shareId);
    };

    const handleDeleteClick = () => {
        if (!shareId) {
            return;
        }

        const toDelete = selectedItems;

        const title = c('Title').t`Delete Permanently`;
        const confirm = c('Action').t`Delete Permanently`;
        const message = c('Info').t`permanently delete selected item(s) from Trash`;

        openConfirmModal(title, confirm, message, async () => {
            const deletedItems = await takeActionForAllItems(toDelete, (item: FileBrowserItem) =>
                deleteLink(shareId, item.LinkID)
            );

            const deletedItemsCount = deletedItems.length;
            if (!deletedItemsCount) {
                return;
            }

            const [{ Name: firstItemName }] = deletedItems;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" deleted permanently from Trash`,
                    `${deletedItemsCount} files deleted permanently from Trash`,
                    deletedItemsCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" deleted permanently from Trash`,
                    `${deletedItemsCount} folders deleted permanently from Trash`,
                    deletedItemsCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" deleted permanently from Trash`,
                    `${deletedItemsCount} items deleted permanently from Trash`,
                    deletedItemsCount
                )
            };

            const notificationText = getNotificationTextForItemList(deletedItems, notificationMessages);
            createNotification({ text: notificationText });
            await events.call(shareId);
        });
    };

    const handleEmptyTrashClick = () => {
        if (!shareId) {
            return;
        }

        const title = c('Title').t`Empty Trash`;
        const confirm = c('Action').t`Empty Trash`;
        const message = c('Info').t`empty Trash and permanently delete all the items`;

        openConfirmModal(title, confirm, message, async () => {
            await emptyTrash(shareId);

            const notificationText = c('Notification').t`All the items are permanently deleted from Trash`;
            createNotification({ text: notificationText });
            events.call(shareId);
        });
    };

    return (
        <Toolbar>
            {
                <>
                    <ToolbarButton
                        disabled={!selectedItems.length || restoreLoading}
                        title={c('Action').t`Restore from Trash`}
                        icon="calendar-repeat"
                        onClick={() => withRestoreLoading(restoreFromTrash())}
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
