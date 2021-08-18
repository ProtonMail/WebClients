import React, { useRef } from 'react';
import { c } from 'ttag';

import { useModals, useNotifications } from '@proton/components';

import DeleteOldFilesConfirmModal from './DeleteOldFilesConfirmModal';
import KeyReactivationModal, { ReactivationOptions } from './KeyReactivationModal';
import useFiles from '../../../hooks/drive/useFiles';

interface ReactivationParams {
    onSuccess?: () => void;
    onError?: () => void;
}

const useKeyReactivationFlow = ({ onSuccess, onError }: ReactivationParams) => {
    const keyReactivationModalId = useRef<string>();
    const deleteOldFilesModalId = useRef<string>();
    const volumesToDelete = useRef<string[]>([]);

    const { deleteOldFiles } = useFiles();
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();

    const handleConfirmation = async () => {
        try {
            await deleteOldFiles(volumesToDelete.current);
            createNotification({
                text: c('Notification').t`Your old files will be deleted in 72 hours`,
            });
            onSuccess?.();
        } catch (e) {
            onError?.();
        }
        removeModal(deleteOldFilesModalId.current);
    };

    const handleKeyReactivationModalSubmit = ({ type }: { type: ReactivationOptions }) => {
        removeModal(keyReactivationModalId.current);

        if (type === ReactivationOptions.ReactivateKeys) {
            onSuccess?.();
        } else if (type === ReactivationOptions.DeleteOldFiles) {
            deleteOldFilesModalId.current = createModal(<DeleteOldFilesConfirmModal onSubmit={handleConfirmation} />);
        }
    };

    const openKeyReactivationModal = (volumeIds: string[]) => {
        volumesToDelete.current = volumeIds;
        keyReactivationModalId.current = createModal(
            <KeyReactivationModal onSubmit={handleKeyReactivationModalSubmit} />
        );
    };

    return {
        openKeyReactivationModal,
    };
};

export default useKeyReactivationFlow;
