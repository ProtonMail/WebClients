import { useHistory } from 'react-router-dom';

import { useModalStateObject } from '@proton/components';

import { useConversation } from '../providers/ConversationProvider';
import { useGhostChat } from '../providers/GhostChatProvider';
import { useIsGuest } from '../providers/IsGuestProvider';

export const useGuestChatHandler = () => {
    const isGuest = useIsGuest();
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();
    const disclaimerModalProps = useModalStateObject();
    const { conversationId } = useConversation();

    const handleGuestClick = () => {
        // If there's an active conversation, show disclaimer modal
        if (conversationId) {
            disclaimerModalProps.openModal(true);
            return;
        }
        
        // If no active conversation (e.g., on Projects route), navigate to new chat
        setGhostChatMode(false);
        history.push('/');
    };

    const handleDisclaimerClose = () => {
        disclaimerModalProps.openModal(false);
    };

    return {
        isGuest,
        showGuestChatDisclaimer: isGuest && !conversationId,
        handleGuestClick,
        handleDisclaimerClose,
        disclaimerModalProps,
    };
};
