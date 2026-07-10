import type { MeetChatMessage } from '@proton/meet/types/types';

/**
 * A thread reply is only relevant to the local participant when it concerns them, i.e. they authored
 * the thread's root message or have taken part in the thread themselves. Root messages and non-thread
 * messages are always relevant.
 */
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
