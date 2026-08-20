import { useEffect, useRef } from 'react';

import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';
import { useConversationDelete } from '../../hooks/useConversationDelete';
import type { Conversation } from '../../types';

interface Props {
    conversation: Conversation;
    onClose: () => void;
    navigateAfterDelete?: boolean;
}

/** Mount only when the user initiates delete — keeps heavy selectors off sidebar list rows. */
export const ConversationDeleteFlow = ({ conversation, onClose, navigateAfterDelete }: Props) => {
    const { openConfirmationModal, showConfirmDeleteModal, handleDelete, confirmDeleteModalProps, hasGeneratedImages } =
        useConversationDelete({
            conversation,
            navigateAfterDelete,
        });

    const hasOpenedRef = useRef(false);

    useEffect(() => {
        if (hasOpenedRef.current) {
            return;
        }
        hasOpenedRef.current = true;
        openConfirmationModal();
    }, [openConfirmationModal]);

    if (!showConfirmDeleteModal) {
        return null;
    }

    return (
        <ConfirmDeleteModal
            handleDelete={handleDelete}
            hasGeneratedImages={hasGeneratedImages}
            {...confirmDeleteModalProps}
            onClose={() => {
                confirmDeleteModalProps.onClose();
                onClose();
            }}
        />
    );
};
