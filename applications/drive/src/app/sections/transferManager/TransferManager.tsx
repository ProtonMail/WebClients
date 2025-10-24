import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';
import { TransferManagerHeader } from './transferManagerHeader/transferManagerHeader';
import { useTransferManagerState } from './useTransferManagerState';

export const TransferManager = () => {
    const { items } = useTransferManagerState();
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
        // TBI
    };

    if (!items.length) {
        return null;
    }

    return (
        <section aria-label={c('Label').t`File transfer overview`}>
            <TransferManagerHeader toggleMinimize={toggleMinimize} isMinimized={isMinimized} onClose={onClose} />

            {!isMinimized && (
                <div>
                    {items.map((item) => (
                        <div key={item.id}>
                            <span>{item.name}</span> - <span>{item.status}</span>
                        </div>
                    ))}
                </div>
            )}
            {uploadConflictModal}
        </section>
    );
};
