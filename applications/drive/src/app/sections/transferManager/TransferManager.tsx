import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useBeforeUnload, useConfirmActionModal } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';
import { uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';

import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { useDriveEventManager } from '../../store';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { TransferManagerHeader } from './transferManagerHeader/transferManagerHeader';
import { TransferManagerList } from './transferManagerList/transferManagerList';
import { useTransferManagerActions } from './useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

import './TransferManager.scss';

interface TransferManagerProps {
    drawerWidth?: number;
    deprecatedRootShareId: string | undefined;
}

export const TransferManager = ({ drawerWidth = 0, deprecatedRootShareId }: TransferManagerProps) => {
    const { items, status } = useTransferManagerState();
    const { clearQueue } = useTransferManagerActions();
    const [isMinimized, setMinimized] = useState(false);
    const [leaveMessage, setLeaveMessage] = useState('');
    const driveEventManager = useDriveEventManager();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    useBeforeUnload(leaveMessage);
    const { hasPendingConflicts, firstConflictItem } = useUploadQueueStore(
        useShallow((state) => ({
            hasPendingConflicts: state.getHasPendingConflicts(),
            firstConflictItem: state.firstConflictItem,
        }))
    );

    const [uploadConflictModal, showUploadConflictModal] = useUploadConflictModal();
    useEffect(() => {
        if (hasPendingConflicts && firstConflictItem) {
            showUploadConflictModal({
                name: firstConflictItem.name,
                nodeType: firstConflictItem.nodeType,
                conflictType: firstConflictItem.conflictType,
                onResolve: (strategy, applyToAll) =>
                    uploadManager.resolveConflict(firstConflictItem.uploadId, strategy, applyToAll),
            });
        }
    }, [hasPendingConflicts, firstConflictItem, showUploadConflictModal]);

    useEffect(() => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            const message = c('Unload warning').t`Changes you made may not be saved.`;
            setLeaveMessage(message);
        } else {
            setLeaveMessage('');
        }
    }, [status]);

    useEffect(() => {
        const actionEventManager = getActionEventManager();
        uploadManager.subscribeToEvents('transfer-manager', async (event) => {
            if (event.type === 'file:complete' && event.isUpdatedNode) {
                await actionEventManager.emit({
                    type: ActionEventName.UPDATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
                });
            } else if (event.type === 'file:complete' && event.isForPhotos) {
                // TODO: Remove when photos section listing is using the sdk
                const { volumeId } = splitNodeUid(event.nodeUid);
                await driveEventManager.pollEvents.volumes(volumeId);
            } else if (event.type === 'file:complete' || event.type === 'folder:complete') {
                await actionEventManager.emit({
                    type: ActionEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
                });
            }
        });

        return () => {
            uploadManager.unsubscribeFromEvents('transfer-manager');
        };
    }, [driveEventManager.pollEvents]);

    const toggleMinimize = () => {
        setMinimized((value) => !value);
    };

    const onClose = () => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            void showConfirmModal({
                title: c('Title').t`Stop transfers?`,
                cancelText: c('Action').t`Continue transfers`,
                submitText: c('Action').t`Stop transfers`,
                message: c('Info')
                    .t`There are files that still need to be transferred. Closing the transfer manager will end all operations.`,
                onSubmit: async () => clearQueue(),
                canUndo: true,
            });
        } else {
            clearQueue();
        }
    };

    if (!items.length) {
        return null;
    }

    return (
        <div
            id="transfer-manager"
            className="transfer-manager-fixed-position right-custom border border-weak"
            style={{
                '--right-custom': `${(drawerWidth + 32) / 16}rem`, // 32 == 2rem
            }}
        >
            <section aria-label={c('Label').t`File transfer overview`}>
                <TransferManagerHeader toggleMinimize={toggleMinimize} isMinimized={isMinimized} onClose={onClose} />

                {!isMinimized && (
                    <div className="mt-3" data-testid="drive-transfers-manager:list">
                        <TransferManagerList items={items} deprecatedRootShareId={deprecatedRootShareId} />
                    </div>
                )}
                {uploadConflictModal}
                {confirmModal}
            </section>
        </div>
    );
};
