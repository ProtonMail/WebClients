import { useCallback } from 'react';

import { useModalStateObject } from '@proton/components';

import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoDispatch } from '../redux/hooks';
import { pushConversationRequest, toggleConversationStarred } from '../redux/slices/core/conversations';
import type { Conversation } from '../types';
import { sendConversationFavoriteEvent } from '../util/telemetry';

interface UseConversationStarProps {
    conversation: Conversation;
    location: 'sidebar' | 'header';
}

export const useConversationStar = ({ conversation, location }: UseConversationStarProps) => {
    const { id, starred } = conversation;
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const favoritesUpsellModal = useModalStateObject();

    const handleStarToggle = useCallback(() => {
        sendConversationFavoriteEvent(isGuest, starred, location);

        if (isGuest) {
            favoritesUpsellModal.openModal(true);
        } else {
            dispatch(toggleConversationStarred(id));
            dispatch(pushConversationRequest({ id }));
        }
    }, [isGuest, starred, location, favoritesUpsellModal, dispatch, id]);

    return {
        handleStarToggle,
        isStarred: starred,
        showFavoritesUpsellModal: favoritesUpsellModal.render,
        favoritesUpsellModalProps: favoritesUpsellModal.modalProps,
    };
};
