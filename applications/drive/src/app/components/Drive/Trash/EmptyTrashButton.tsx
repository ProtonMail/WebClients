import React from 'react';
import { c } from 'ttag';
import { useNotifications, FloatingButton, SidebarPrimaryButton } from 'react-components';
import useTrash from '../../../hooks/drive/useTrash';
import useConfirm from '../../../hooks/util/useConfirm';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import useEvents from '../../../hooks/drive/useEvents';

interface Props {
    shareId: string;
    floating?: boolean;
}

const EmptyTrashButton = ({ shareId, floating }: Props) => {
    const cache = useDriveCache();
    const events = useEvents();
    const { emptyTrash } = useTrash();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();
    const disabled = !cache.get.trashMetas(shareId).length;

    const handleEmptyTrashClick = () => {
        const title = c('Title').t`Empty trash`;
        const confirm = c('Action').t`Empty trash`;
        const message = c('Info').t`Are you sure you want to empty trash and permanently delete all the items?`;

        openConfirmModal(title, confirm, message, async () => {
            try {
                await emptyTrash(shareId);
                const notificationText = c('Notification').t`All items will soon be permanently deleted from trash`;
                createNotification({ text: notificationText });
                await events.callAll(shareId);
            } catch (e) {
                console.error(e);
            }
        });
    };

    return (
        <>
            {floating ? (
                <FloatingButton
                    disabled={disabled}
                    className="pm-button--error"
                    onClick={handleEmptyTrashClick}
                    title={c('Action').t`Empty trash`}
                    icon="empty-folder"
                />
            ) : (
                <SidebarPrimaryButton
                    className="pm-button--error"
                    disabled={disabled}
                    onClick={handleEmptyTrashClick}
                >{c('Action').t`Empty trash`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default EmptyTrashButton;
