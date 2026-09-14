import type { MeetChatMessage } from '../types/types';

/** Thread replies are relevant only when the local participant authored or joined the thread. */
export const isRelevantThreadMessage = (
    message: MeetChatMessage,
    chatMessages: MeetChatMessage[],
    localIdentity: string
) => {
    const isReply = !!message.topicId && message.topicId !== message.id;

    if (!isReply) {
        return true;
    }

    return chatMessages.some(
        (m) => (m.id === message.topicId || m.topicId === message.topicId) && m.identity === localIdentity
    );
};
