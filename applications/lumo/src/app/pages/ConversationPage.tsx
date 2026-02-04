import { InteractiveConversationComponent } from '../ui/interactiveConversation/InteractiveConversationComponent';

/**
 * ConversationPage is the main page for the chat/conversation interface.
 * It works for both authenticated and guest users.
 * User data is provided via SafeUserContext.
 */
export const ConversationPage = () => {
    return <InteractiveConversationComponent />;
};
