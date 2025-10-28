import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';
import { TransferItem } from './transferItem/transferItem';
import { TransferManagerHeader } from './transferManagerHeader/transferManagerHeader';
import { useTransferManagerActions } from './useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

import './TransferManager.scss';

export const TransferManager = () => {
    const { items, status } = useTransferManagerState();
    const { clearQueue } = useTransferManagerActions();
    const [isMinimized, setMinimized] = useState(false);
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
        <div className="transfer-manager-fixed-position">
            <section aria-label={c('Label').t`File transfer overview`}>
                <TransferManagerHeader toggleMinimize={toggleMinimize} isMinimized={isMinimized} onClose={onClose} />

                {!isMinimized && (
                    <div className="mt-3 flex flex-column gap-2 px-4 pb-4">
                        {items.map((item) => (
                            <TransferItem key={item.id} entry={item} />
                        ))}
                    </div>
                )}
                {uploadConflictModal}
            </section>
        </div>
    );
};
