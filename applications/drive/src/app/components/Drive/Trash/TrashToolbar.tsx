import React from 'react';
import { c } from 'ttag';

import {
    Toolbar,
    ToolbarButton,
    useNotifications,
    useModals,
    Alert,
    useLoading,
    useEventManager,
    ToolbarSeparator
} from 'react-components';

import useDrive from '../../../hooks/useDrive';
import useTrash from '../../../hooks/useTrash';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import ConfirmDeleteModal from '../../ConfirmDeleteModal';
import { useListNotifications } from '../helpers';
import { useTrashContent } from './TrashContentProvider';

interface Props {
    shareId: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { createRestoredLinksNotifications, createDeleteLinksNotifications } = useListNotifications();
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
        const result = await restoreLinks(
            shareId,
            selectedItems.map(({ LinkID }) => LinkID)
        );
        createRestoredLinksNotifications(toRestore, result);
        await events.call(shareId);
    };

    const handleDeleteClick = () => {
        const toDelete = selectedItems;

        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message = c('Info').t`permanently delete selected item(s) from Trash`;

        openConfirmModal(title, confirm, message, async () => {
            const deleted = await deleteLinks(
                shareId,
                toDelete.map(({ LinkID }) => LinkID)
            );

            createDeleteLinksNotifications(toDelete, deleted);
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
                        icon="repeat"
                        onClick={() => withRestoreLoading(restoreFromTrash())}
                    />
                    <ToolbarSeparator />
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
