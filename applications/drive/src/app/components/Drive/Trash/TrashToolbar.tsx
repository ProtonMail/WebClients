import React from 'react';
import { c, msgid } from 'ttag';

import {
    Toolbar,
    ToolbarButton,
    useNotifications,
    useModals,
    Alert,
    useLoading,
    useEventManager
} from 'react-components';

import useDrive from '../../../hooks/useDrive';
import useTrash from '../../../hooks/useTrash';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import ConfirmDeleteModal from '../../ConfirmDeleteModal';
import { getNotificationTextForItemList } from '../helpers';
import { useTrashContent } from './TrashContentProvider';
import { RestoreFromTrashResult, RestoreResponse, RESTORE_STATUS_CODE } from '../../../interfaces/restore';
import { FileBrowserItem } from '../../FileBrowser/FileBrowser';

interface Props {
    shareId: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { events } = useDrive();
    const { restoreLinks, deleteLinks, emptyTrash } = useTrash();
    const [restoreLoading, withRestoreLoading] = useLoading();
    const cache = useDriveCache();
    const { fileBrowserControls } = useTrashContent();
    const { call } = useEventManager();
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
        const toRestore = selectedItems;

        const result: RestoreFromTrashResult = await restoreLinks(
            shareId,
            toRestore.map(({ LinkID }) => LinkID)
        );

        const restoredItems: FileBrowserItem[] = [];
        const alreadyExistingItems: FileBrowserItem[] = [];
        const otherErrors: string[] = [];
        result.Responses.forEach((r: { Response: RestoreResponse }, index: number) => {
            if (r.Response.Error) {
                if (r.Response.Code === RESTORE_STATUS_CODE.ALREADY_EXISTS) {
                    alreadyExistingItems.push(toRestore[index]);
                } else {
                    otherErrors.push(r.Response.Error);
                }
            } else {
                restoredItems.push(toRestore[index]);
            }
        });

        const restoredItemsCount = restoredItems.length;
        if (restoredItemsCount) {
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

            const notificationText = getNotificationTextForItemList(toRestore, notificationMessages);
            createNotification({ text: notificationText, type: 'success' });
        }

        const alreadyExistingItemsCount = alreadyExistingItems.length;
        if (alreadyExistingItemsCount) {
            const [{ Name: firstItemName }] = alreadyExistingItems;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`A file with the name "${firstItemName}" already exists in current folder`,
                    `${alreadyExistingItemsCount} files with same names already exists in current folder`,
                    alreadyExistingItemsCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`A folder with the name "${firstItemName}" already exists in current folder`,
                    `${alreadyExistingItemsCount} folders with same names already exists in current folder`,
                    alreadyExistingItemsCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`An item with the name "${firstItemName}" already exists in current folder`,
                    `${alreadyExistingItemsCount} items with same names already exists in current folder`,
                    alreadyExistingItemsCount
                )
            };

            const notificationText = getNotificationTextForItemList(toRestore, notificationMessages);
            createNotification({ text: notificationText, type: 'error' });
        }

        otherErrors.forEach((error) => {
            createNotification({ text: error, type: 'error' });
        });

        await events.call(shareId);
    };

    const handleDeleteClick = () => {
        const toDelete = selectedItems;

        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message = c('Info').t`permanently delete selected item(s) from Trash`;

        openConfirmModal(title, confirm, message, async () => {
            await deleteLinks(
                shareId,
                toDelete.map(({ LinkID }) => LinkID)
            );

            const deletedItemsCount = toDelete.length;
            if (!deletedItemsCount) {
                return;
            }

            const [{ Name: firstItemName }] = toDelete;
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

            const notificationText = getNotificationTextForItemList(toDelete, notificationMessages);
            createNotification({ text: notificationText });
            await Promise.allSettled([events.call(shareId), call()]);
        });
    };

    const handleEmptyTrashClick = () => {
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
                        title={c('Action').t`Delete permanently`}
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
