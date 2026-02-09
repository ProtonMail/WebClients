import { useChat } from './useChat';
import { useParticipantEvents } from './useParticipantEvents';

export const useBridges = () => {
    useChat();
    useParticipantEvents();
};
