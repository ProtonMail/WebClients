import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject, useNotifications } from '@proton/components/index';

import { useLumoNavigate } from '../../../hooks/useLumoNavigate';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { deleteAllSpacesRequest, selectHasSpaces } from '../../../redux/slices/core/spaces';
import ConfirmDeleteModal from "../ConfirmDeleteModal";

const DeleteAllButton = ({ onClose }: { onClose?: () => void }) => {
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { createNotification } = useNotifications();
    const [isDeletionInProgress, setIsDeletionInProgress] = useState(false);
    const confirmDeleteModal = useModalStateObject();

    const hasSpaces = useLumoSelector(selectHasSpaces);

    useEffect(() => {
        if (isDeletionInProgress && !hasSpaces) {
            setIsDeletionInProgress(false);
            confirmDeleteModal.openModal(false);
            createNotification({
                type: 'success',
                text: c('collider_2025: Success').t`All chats deleted successfully`,
            });
            navigate('/');
            onClose?.();
        }
    }, [isDeletionInProgress, hasSpaces, confirmDeleteModal, createNotification, navigate, onClose]);

    const handleDeleteAll = () => {
        setIsDeletionInProgress(true);
        dispatch(deleteAllSpacesRequest());
    };

    const openConfirmationModal = () => {
        confirmDeleteModal.openModal(true);
    };

    return (
        <>
            <Button
                shape="outline"
                color="danger"
                disabled={isDeletionInProgress || !hasSpaces}
                onClick={openConfirmationModal}
            >
                {c('collider_2025: Button').t`Delete all`}
            </Button>
            {confirmDeleteModal.render && (
                <ConfirmDeleteModal
                    handleDelete={handleDeleteAll}
                    deleteAll={true}
                    loading={isDeletionInProgress}
                    {...confirmDeleteModal.modalProps}
                />
            )}
        </>
    );
};

export default DeleteAllButton;
