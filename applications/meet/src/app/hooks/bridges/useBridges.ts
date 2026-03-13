import { useChat } from './useChat';
import { useChatMessageReactionReceiver } from './useChatMessageReactionReceiver';
import { useEmojiReactionReceiver } from './useEmojiReactionReceiver';
import { useParticipantEvents } from './useParticipantEvents';
import { useRaiseHandReceiver } from './useRaiseHandReceiver';

export const useBridges = () => {
    useChat();
    useParticipantEvents();
    useEmojiReactionReceiver();
    useRaiseHandReceiver();
    useChatMessageReactionReceiver();
};
