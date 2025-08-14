import { useRouteMatch } from 'react-router-dom';

import { useIsGuest } from '../providers/IsGuestProvider';
import { sendConversationNewChatEvent } from '../util/telemetry';

export const useNewChatNavigation = () => {
    const isGuest = useIsGuest();
    const isChatInProgress = useRouteMatch('/c/:conversationId');

    const handleNewChatClick = (e: React.MouseEvent<HTMLAnchorElement>, onGuestAction?: () => void) => {
        sendConversationNewChatEvent(isGuest);

        // Allow default behavior (new tab) if ctrl/cmd is pressed
        if (e.ctrlKey || e.metaKey) {
            return;
        }

        // If user is a guest and in chat view, prevent navigation and show disclaimer modal
        if (isGuest && isChatInProgress) {
            e.preventDefault();
            onGuestAction?.();
            return;
        }

        // For regular users in a chat, allow normal Link navigation
    };

    return {
        handleNewChatClick,
    };
};
