import { useModalStateObject } from '@proton/components';

import { useConversation } from '../providers/ConversationProvider';
import { useIsGuest } from '../providers/IsGuestProvider';

export const useGuestChatHandler = () => {
    const isGuest = useIsGuest();
    const disclaimerModalProps = useModalStateObject();
    // const isChatInProgress = useRouteMatch('/c/:conversationId');
    const { conversationId } = useConversation();

    const handleGuestClick = () => {
        if (!conversationId) {
            return;
        }
        disclaimerModalProps.openModal(true);
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
