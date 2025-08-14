import { useCallback } from 'react';

import { c } from 'ttag';

import { useModalStateObject, useNotifications } from '@proton/components';

import { useLumoDispatch } from '../redux/hooks';
import { locallyDeleteSpaceFromLocalRequest, pushSpaceRequest } from '../redux/slices/core/spaces';
import type { Conversation } from '../types';
import { sendConversationDeleteEvent } from '../util/telemetry';
import { useLumoNavigate } from './useLumoNavigate';

interface UseConversationDeleteProps {
    conversation: Conversation;
}

export const useConversationDelete = ({ conversation }: UseConversationDeleteProps) => {
    const { spaceId } = conversation;
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { createNotification } = useNotifications();
    const confirmDeleteModal = useModalStateObject();

    const openConfirmationModal = useCallback(() => {
        confirmDeleteModal.openModal(true);
    }, [confirmDeleteModal]);

    const handleDelete = useCallback(async () => {
        sendConversationDeleteEvent();

        try {
            dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
            dispatch(pushSpaceRequest({ id: spaceId }));

            createNotification({ text: c('Success').jt`Conversation deleted` });
        } catch (error) {
            createNotification({ text: <>{error}</>, type: 'error' });
        }

        confirmDeleteModal.openModal(false);
        navigate('/');
    }, [spaceId, dispatch, createNotification, confirmDeleteModal, navigate]);

    return {
        openConfirmationModal,
        showConfirmDeleteModal: confirmDeleteModal.render,
        confirmDeleteModalProps: confirmDeleteModal.modalProps,
        handleDelete,
    };
};
