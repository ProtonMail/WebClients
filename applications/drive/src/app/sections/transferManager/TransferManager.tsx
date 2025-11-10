import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useBeforeUnload, useDrawerWidth } from '@proton/components';

import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';
import { TransferManagerHeader } from './transferManagerHeader/transferManagerHeader';
import { TransferManagerList } from './transferManagerList/transferManagerList';
import { useTransferManagerActions } from './useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

import './TransferManager.scss';

export const TransferManager = () => {
    const { items, status } = useTransferManagerState();
    const { clearQueue } = useTransferManagerActions();
    const [isMinimized, setMinimized] = useState(false);
    const drawerWidth = useDrawerWidth();
    const [leaveMessage, setLeaveMessage] = useState('');
    useBeforeUnload(leaveMessage);
    const { pendingConflict } = useUploadQueueStore(
        useShallow((state) => ({
            pendingConflict: state.getFirstPendingConflict(),
        }))
    );

    const [uploadConflictModal, showUploadConflictModal] = useUploadConflictModal();
    useEffect(() => {
        if (pendingConflict) {
            showUploadConflictModal({
                name: pendingConflict.name,
                nodeType: pendingConflict.nodeType,
                conflictType: pendingConflict.conflictType,
                onResolve: pendingConflict.resolve,
            });
        }
    }, [pendingConflict, showUploadConflictModal]);

    useEffect(() => {
        if (status === TransferManagerStatus.InProgress) {
            const message = c('Unload warning').t`Changes you made may not be saved.`;
            setLeaveMessage(message);
        } else {
            setLeaveMessage('');
        }
    }, [status]);

    const toggleMinimize = () => {
        setMinimized((value) => !value);
    };

    const onClose = () => {
        if (status !== TransferManagerStatus.InProgress) {
            clearQueue();
        }
        // TBI request to cancell all transfers in progress with modal
    };

    if (!items.length) {
        return null;
    }

    return (
        <div
            id="transfer-manager"
            className="transfer-manager-fixed-position right-custom"
            style={{
                '--right-custom': `${drawerWidth + 32}px`, // 32 == 2rem
            }}
        >
            <section aria-label={c('Label').t`File transfer overview`}>
                <TransferManagerHeader toggleMinimize={toggleMinimize} isMinimized={isMinimized} onClose={onClose} />

                {!isMinimized && (
                    <div className="mt-3" data-testid="drive-transfers-manager:list">
                        <TransferManagerList items={items} />
                    </div>
                )}
                {uploadConflictModal}
            </section>
        </div>
    );
};
