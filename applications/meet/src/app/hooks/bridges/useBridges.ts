import { useChat } from './useChat';
import { useChatMessageReactionReceiver } from './useChatMessageReactionReceiver';
import { useEmojiReactionReceiver } from './useEmojiReactionReceiver';
import { useParticipantEvents } from './useParticipantEvents';

export const useBridges = () => {
    useChat();
    useParticipantEvents();
    useEmojiReactionReceiver();
    // No-op when MeetNewChatHandling is enabled (reactions handled in useChat).
    useChatMessageReactionReceiver();
};
