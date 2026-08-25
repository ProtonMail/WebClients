import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components';

import { useLumoDispatch, useLumoMemoSelector } from '../redux/hooks';
import { selectConversationHasGeneratedImages, selectSpaceById } from '../redux/selectors';
import { locallyDeleteConversationFromLocalRequest } from '../redux/slices/core/conversations';
import { locallyDeleteSpaceFromLocalRequest } from '../redux/slices/core/spaces';
import type { Conversation } from '../types';
import { sendConversationDeleteEvent } from '../util/telemetry';
import { useLumoNavigate } from './useLumoNavigate';

interface UseConversationDeleteProps {
    conversation: Conversation;
    navigateAfterDelete?: boolean;
}

export const useConversationDelete = ({ conversation, navigateAfterDelete = true }: UseConversationDeleteProps) => {
    const { id: conversationId, spaceId } = conversation;
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { createNotification } = useNotifications();
    const {
        openModal: openConfirmDeleteModal,
        render: showConfirmDeleteModal,
        modalProps: confirmDeleteModalProps,
    } = useModalStateObject();
    const space = useLumoMemoSelector(selectSpaceById, [spaceId]);
    const hasGeneratedImages = useLumoMemoSelector(selectConversationHasGeneratedImages, [conversationId]);

    const openConfirmationModal = useCallback(() => {
        openConfirmDeleteModal(true);
    }, [openConfirmDeleteModal]);

    const handleDelete = useCallback(async () => {
        sendConversationDeleteEvent();

        // Project spaces and any space with more than one chat only delete the conversation (legacy 1:1 was space delete)
        const deleteConversationOnly = space?.isProject === true;

        try {
            if (deleteConversationOnly) {
                dispatch(locallyDeleteConversationFromLocalRequest(conversationId));
            } else {
                dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
            }

            createNotification({ text: c('Success').jt`Conversation deleted` });
        } catch (error) {
            createNotification({ text: <>{error}</>, type: 'error' });
        }

        openConfirmDeleteModal(false);

        if (navigateAfterDelete) {
            navigate('/');
        }
    }, [
        conversationId,
        spaceId,
        space?.isProject,
        dispatch,
        createNotification,
        openConfirmDeleteModal,
        navigate,
        navigateAfterDelete,
    ]);

    return {
        openConfirmationModal,
        showConfirmDeleteModal,
        confirmDeleteModalProps,
        handleDelete,
        hasGeneratedImages,
    };
};
